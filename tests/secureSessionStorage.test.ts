/** SF-04: sesja Supabase w SecureStore (z podziałem na fragmenty i migracją z AsyncStorage). */
import { CHUNK_SIZE, createSecureSessionStorage } from '@/lib/secureSessionStorage';

function memorySecure() {
  const map = new Map<string, string>();
  return {
    map,
    getItemAsync: async (k: string) => map.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => {
      if (v.length > 2048) throw new Error('value too large for SecureStore');
      map.set(k, v);
    },
    deleteItemAsync: async (k: string) => {
      map.delete(k);
    },
  };
}

function memoryLegacy(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return { map, getItem: async (k: string) => map.get(k) ?? null, removeItem: async (k: string) => { map.delete(k); } };
}

const KEY = 'sb-project-auth-token';
const bigSession = JSON.stringify({ access_token: 'a'.repeat(5000), refresh_token: 'r'.repeat(40) });

test('large sessions round-trip through chunked secure storage', async () => {
  const secure = memorySecure();
  const storage = createSecureSessionStorage(secure);
  await storage.setItem(KEY, bigSession);
  expect(await storage.getItem(KEY)).toBe(bigSession);
  expect(secure.map.get(`${KEY}.chunks`)).toBe(String(Math.ceil(bigSession.length / CHUNK_SIZE)));
});

test('shrinking a session removes stale chunks and removeItem clears everything', async () => {
  const secure = memorySecure();
  const storage = createSecureSessionStorage(secure);
  await storage.setItem(KEY, bigSession);
  await storage.setItem(KEY, 'small');
  expect(await storage.getItem(KEY)).toBe('small');
  expect([...secure.map.keys()].filter((k) => k.startsWith(`${KEY}.chunk.`))).toHaveLength(1);
  await storage.removeItem(KEY);
  expect(secure.map.size).toBe(0);
});

test('legacy AsyncStorage session is migrated once and deleted from plaintext storage', async () => {
  const secure = memorySecure();
  const legacy = memoryLegacy({ [KEY]: bigSession });
  const storage = createSecureSessionStorage(secure, legacy);
  expect(await storage.getItem(KEY)).toBe(bigSession);
  expect(legacy.map.has(KEY)).toBe(false);
  expect(await storage.getItem(KEY)).toBe(bigSession);
});

test('interrupted write (missing count or chunk) is treated as no session', async () => {
  const secure = memorySecure();
  const storage = createSecureSessionStorage(secure);
  await storage.setItem(KEY, bigSession);
  secure.map.delete(`${KEY}.chunk.1`);
  expect(await storage.getItem(KEY)).toBeNull();
});
