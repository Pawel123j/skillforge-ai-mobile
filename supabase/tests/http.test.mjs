import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

// Run only against the disposable local Auth/PostgREST stack created by the
// integration runner. It removes its own entire database after the test.
const url = process.env.SKILLFORGE_TEST_SUPABASE_URL;
const anonKey = process.env.SKILLFORGE_TEST_ANON_KEY;
test('real Supabase Auth and PostgREST isolate two users', { skip: !url || !anonKey }, async (t) => {
  assert.ok(['127.0.0.1', 'localhost'].includes(new URL(url).hostname));
  const client = (key = anonKey) => createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const [alice, bob, anonymous] = [client(), client(), client()];
  const password = randomUUID() + 'Aa1!';
  const emails = [0, 1].map(() => `stage3-${randomUUID()}@example.test`);
  const users = [];
  for (const [index, userClient] of [alice, bob].entries()) {
    const result = await userClient.auth.signUp({ email: emails[index], password,
      options: { data: { full_name: index === 0 ? 'Alice fixture' : 'Bob fixture' } } });
    assert.equal(result.error, null, result.error?.message);
    assert.ok(result.data.session, 'local test stack explicitly uses email autoconfirm');
    users.push(result.data.user.id);
  }
  const [a, b] = users;
  const owned = ['profiles', 'user_progress', 'tasks', 'projects', 'quiz_results'];
  const content = ['learning_paths', 'modules', 'lessons', 'quiz_questions'];
  let moduleId;

  await t.test('signup initializes profile and progress exactly once', async () => {
    for (const [userClient, user] of [[alice, a], [bob, b]]) {
      for (const table of ['profiles', 'user_progress']) {
        const result = await userClient.from(table).select('*');
        assert.equal(result.error, null);
        assert.equal(result.data.length, 1);
        assert.equal(result.data[0].user_id, user);
      }
    }
  });
  await t.test('password login, rejection and refresh use the real Auth API', async () => {
    const bad = await anonymous.auth.signInWithPassword({ email: emails[0], password: 'wrong-password' });
    assert.ok(bad.error);
    const login = await alice.auth.signInWithPassword({ email: emails[0], password });
    assert.equal(login.error, null);
    assert.equal(login.data.user.id, a);
    const refresh = await alice.auth.refreshSession();
    assert.equal(refresh.error, null);
    assert.equal(refresh.data.user.id, a);
  });
  await t.test('anonymous cannot read any application data', async () => {
    for (const table of [...owned, ...content]) {
      const result = await anonymous.from(table).select('*');
      assert.equal(result.error, null);
      assert.deepEqual(result.data, []);
    }
  });
  await t.test('authenticated learning content is readable and immutable', async () => {
    for (const table of content) {
      const result = await alice.from(table).select('*');
      assert.equal(result.error, null);
      assert.ok(result.data.length > 0);
      const row = result.data[0];
      if (table === 'modules') moduleId = row.id;
      const changed = await alice.from(table).update({ id: row.id }).eq('id', row.id).select();
      assert.equal(changed.error, null);
      assert.deepEqual(changed.data, []);
      const deleted = await alice.from(table).delete().eq('id', row.id).select();
      assert.equal(deleted.error, null);
      assert.deepEqual(deleted.data, []);
    }
  });
  for (const table of ['tasks', 'projects']) {
    await t.test(`${table}: owner CRUD, foreign reads/writes and forged ownership`, async () => {
      const inserted = await alice.from(table).insert({ user_id: a, title: 'private fixture' }).select().single();
      assert.equal(inserted.error, null);
      const id = inserted.data.id;
      const hidden = await bob.from(table).select('*').eq('id', id);
      assert.equal(hidden.error, null);
      assert.deepEqual(hidden.data, []);
      for (const request of [
        bob.from(table).update({ title: 'stolen' }).eq('id', id).select(),
        bob.from(table).delete().eq('id', id).select(),
      ]) {
        const denied = await request;
        assert.equal(denied.error, null);
        assert.deepEqual(denied.data, []);
      }
      const forged = await bob.from(table).insert({ user_id: a, title: 'forged' }).select();
      assert.equal(forged.error?.code, '42501');
      const transferred = await alice.from(table).update({ user_id: b }).eq('id', id).select();
      assert.equal(transferred.error?.code, '42501');
      const edited = await alice.from(table).update({ title: 'edited' }).eq('id', id).select().single();
      assert.equal(edited.error, null);
      assert.equal(edited.data.title, 'edited');
      const removed = await alice.from(table).delete().eq('id', id).select();
      assert.equal(removed.error, null);
      assert.equal(removed.data.length, 1);
    });
  }
  await t.test('profile and progress updates cannot access or transfer another identity', async () => {
    for (const [table, values] of [['profiles', { full_name: 'Changed fixture' }], ['user_progress', { xp: 25 }]]) {
      const own = await alice.from(table).update(values).eq('user_id', a).select().single();
      assert.equal(own.error, null);
      const foreign = await bob.from(table).update(values).eq('user_id', a).select();
      assert.equal(foreign.error, null);
      assert.deepEqual(foreign.data, []);
      const transferred = await alice.from(table).update({ user_id: b }).eq('user_id', a).select();
      assert.ok(transferred.error, 'ownership transfer must fail');
    }
  });
  await t.test('quiz results are private, append-only and reject another user id', async () => {
    const values = { user_id: a, module_id: moduleId, score: 1, total_questions: 1, passed: true };
    const own = await alice.from('quiz_results').insert(values).select().single();
    assert.equal(own.error, null);
    const forged = await bob.from('quiz_results').insert(values);
    assert.equal(forged.error?.code, '42501');
    const foreign = await bob.from('quiz_results').select('*');
    assert.equal(foreign.error, null);
    assert.deepEqual(foreign.data, []);
    for (const request of [
      alice.from('quiz_results').update({ score: 0 }).eq('id', own.data.id).select(),
      alice.from('quiz_results').delete().eq('id', own.data.id).select(),
    ]) {
      const result = await request;
      assert.equal(result.error, null);
      assert.deepEqual(result.data, []);
    }
  });
  await t.test('tampered access tokens are rejected by PostgREST', async () => {
    const session = await alice.auth.getSession();
    const token = session.data.session.access_token;
    const pieces = token.split('.');
    pieces[2] = (pieces[2][0] === 'a' ? 'b' : 'a') + pieces[2].slice(1);
    const response = await fetch(`${url}/rest/v1/profiles?select=*`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${pieces.join('.')}` },
    });
    assert.equal(response.status, 401);
  });
  await t.test('logout removes the client session and returns to anonymous permissions', async () => {
    assert.equal((await alice.auth.signOut()).error, null);
    assert.equal((await alice.auth.getSession()).data.session, null);
    const result = await alice.from('profiles').select('*');
    assert.equal(result.error, null);
    assert.deepEqual(result.data, []);
    assert.equal((await bob.auth.signOut()).error, null);
  });
});
