/**
 * Magazyn sesji Supabase w zaszyfrowanym magazynie platformy (SF-04).
 *
 * Wcześniej access/refresh token leżały w AsyncStorage — niezaszyfrowanym pliku,
 * czytelnym z kopii zapasowej lub na urządzeniu z rootem. Teraz trafiają do
 * Keychain (iOS) / Keystore (Android) przez expo-secure-store.
 *
 * SecureStore ma limit rozmiaru pojedynczej wartości (~2 KB), a sesja Supabase
 * bywa większa, więc wartość jest dzielona na fragmenty. Sesja zapisana wcześniej
 * w AsyncStorage jest przy pierwszym odczycie przenoszona i usuwana ze starego miejsca.
 */

export interface SecureBackend {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export interface LegacyBackend {
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

export interface SupabaseStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const CHUNK_SIZE = 1800;

const countKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, index: number) => `${key}.chunk.${index}`;

export function createSecureSessionStorage(secure: SecureBackend, legacy?: LegacyBackend): SupabaseStorage {
  async function readSecure(key: string): Promise<string | null> {
    const rawCount = await secure.getItemAsync(countKey(key));
    if (rawCount === null) return null;
    const count = Number.parseInt(rawCount, 10);
    if (!Number.isInteger(count) || count < 0) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = await secure.getItemAsync(chunkKey(key, i));
      if (part === null) return null; // niekompletny zapis — traktujemy jak brak sesji
      parts.push(part);
    }
    return parts.join('');
  }

  async function removeSecure(key: string): Promise<void> {
    const rawCount = await secure.getItemAsync(countKey(key));
    const count = rawCount === null ? 0 : Number.parseInt(rawCount, 10) || 0;
    await secure.deleteItemAsync(countKey(key));
    for (let i = 0; i < count; i += 1) {
      await secure.deleteItemAsync(chunkKey(key, i));
    }
  }

  async function writeSecure(key: string, value: string): Promise<void> {
    await removeSecure(key);
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i += 1) {
      await secure.setItemAsync(chunkKey(key, i), value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    // Licznik zapisywany na końcu: przerwany zapis nie zostawi połowy sesji jako ważnej.
    await secure.setItemAsync(countKey(key), String(count));
  }

  return {
    async getItem(key) {
      const stored = await readSecure(key);
      if (stored !== null || !legacy) return stored;
      const old = await legacy.getItem(key);
      if (old !== null) {
        await writeSecure(key, old);
        await legacy.removeItem(key);
      }
      return old;
    },
    setItem: writeSecure,
    async removeItem(key) {
      await removeSecure(key);
      if (legacy) await legacy.removeItem(key);
    },
  };
}
