import { createNativeSessionStorage, SessionStorage } from '@/lib/sessionStorage';

function memory(): SessionStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return { values, getItem: async (key) => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); }, removeItem: async (key) => { values.delete(key); } };
}

test('migrates a large session and removes the plaintext copy, then signs out', async () => {
  const secure = memory(); const legacy = memory();
  const session = JSON.stringify({ refresh_token: 'x'.repeat(6000) });
  await legacy.setItem('sb-test-auth-token', session);
  const adapter = createNativeSessionStorage(secure, legacy);
  expect(await adapter.getItem('sb-test-auth-token')).toBe(session);
  expect(legacy.values.size).toBe(0);
  expect([...secure.values.values()].every((v) => v.length < 1800)).toBe(true);
  expect(await createNativeSessionStorage(secure, legacy).getItem('sb-test-auth-token')).toBe(session);
  await adapter.removeItem('sb-test-auth-token');
  expect(secure.values.size).toBe(0);
  expect(await adapter.getItem('sb-test-auth-token')).toBeNull();
});

test('failed secure migration retains recoverable old data and propagates error', async () => {
  const secure = memory(); const legacy = memory();
  await legacy.setItem('key', 'session');
  secure.setItem = async () => { throw new Error('Keychain unavailable'); };
  await expect(createNativeSessionStorage(secure, legacy).getItem('key')).rejects.toThrow('Keychain unavailable');
  expect(await legacy.getItem('key')).toBe('session');
});

test('interrupted refresh preserves complete prior session', async () => {
  const secure = memory(); const legacy = memory();
  const adapter = createNativeSessionStorage(secure, legacy);
  await adapter.setItem('key', 'old');
  const write = secure.setItem;
  secure.setItem = async (key, value) => { if (value === 'new') throw new Error('disk full'); await write(key, value); };
  await expect(adapter.setItem('key', 'new')).rejects.toThrow('disk full');
  expect(await adapter.getItem('key')).toBe('old');
});

test('queued sign-out cannot be undone by an earlier refresh', async () => {
  const secure = memory(); const legacy = memory();
  const adapter = createNativeSessionStorage(secure, legacy);
  await Promise.all([adapter.setItem('key', 'session'), adapter.removeItem('key')]);
  expect(await adapter.getItem('key')).toBeNull();
});
