/** Native sessions live in Keychain/Keystore. Web uses its browser-local store.
 * Chunking avoids platform value-size limits. The manifest is written last so
 * failed refreshes do not replace the previously complete session.
 */
export interface SessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export function createNativeSessionStorage(secure: SessionStorage, legacy: SessionStorage): SessionStorage {
  const queues = new Map<string, Promise<unknown>>();
  const prefix = (key: string) => `session.${Array.from(key).map((c) => c.charCodeAt(0).toString(16)).join('_')}`;
  type Manifest = { generation: string; count: number };
  const readManifest = async (base: string): Promise<Manifest | null> => {
    const raw = await secure.getItem(base);
    if (!raw) return null;
    const data = JSON.parse(raw) as Manifest;
    if (!/^[a-z0-9-]+$/.test(data.generation) || !Number.isInteger(data.count) || data.count < 1 || data.count > 1000) {
      throw new Error('Invalid secure session. Sign in again.');
    }
    return data;
  };
  const clearChunks = async (base: string, manifest: Manifest) => {
    for (let i = 0; i < manifest.count; i++) await secure.removeItem(`${base}.${manifest.generation}.${i}`);
  };
  const write = async (key: string, value: string) => {
    const base = prefix(key);
    const old = await readManifest(base);
    const next = { generation: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, count: Math.max(1, Math.ceil(value.length / 450)) };
    // 450 UTF-16 units stay below 1800 UTF-8 bytes for every chunk.
    let committed = false;
    try {
      for (let i = 0; i < next.count; i++) await secure.setItem(`${base}.${next.generation}.${i}`, value.slice(i * 450, (i + 1) * 450));
      await secure.setItem(base, JSON.stringify(next));
      committed = true;
      await legacy.removeItem(key);
      if (old) await clearChunks(base, old);
    } catch (error) {
      if (!committed) await clearChunks(base, next).catch(() => undefined);
      throw error;
    }
  };
  function serial<T>(key: string, action: () => Promise<T>): Promise<T> {
    const operation = (queues.get(key) ?? Promise.resolve()).catch(() => undefined).then(action);
    queues.set(key, operation);
    void operation.finally(() => { if (queues.get(key) === operation) queues.delete(key); }).catch(() => undefined);
    return operation;
  }
  return {
    getItem: (key) => serial(key, async () => {
      const base = prefix(key);
      const manifest = await readManifest(base);
      if (manifest) {
        let value = '';
        for (let i = 0; i < manifest.count; i++) {
          const chunk = await secure.getItem(`${base}.${manifest.generation}.${i}`);
          if (chunk === null) throw new Error('Incomplete secure session. Sign in again.');
          value += chunk;
        }
        // Finish cleanup if a previous migration was interrupted after commit.
        await legacy.removeItem(key);
        return value;
      }
      const value = await legacy.getItem(key);
      if (value !== null) await write(key, value);
      return value;
    }),
    setItem: (key, value) => serial(key, () => write(key, value)),
    removeItem: (key) => serial(key, async () => {
      await legacy.removeItem(key);
      const base = prefix(key);
      const manifest = await readManifest(base).catch(() => null);
      // Invalidate first; interrupted cleanup must never resurrect a session.
      await secure.removeItem(base);
      if (manifest) await clearChunks(base, manifest);
    }),
  };
}
