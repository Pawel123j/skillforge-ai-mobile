const assert = require('node:assert/strict');

function bracesChecks(braces) {
  assert.deepEqual(braces.expand('src/{app,components}/**/*.{ts,tsx}'), [
    'src/app/**/*.ts', 'src/app/**/*.tsx', 'src/components/**/*.ts', 'src/components/**/*.tsx',
  ]);
  assert.deepEqual(braces.expand('v{1..3}'), ['v1', 'v2', 'v3']);
  for (const [open, close] of [['{', '}'], ['(', ')'], ['{(', ')}'], ['{(', '})']]) {
    for (const depth of [129, 4000, 10000]) {
      for (const ending of [close.repeat(depth), '']) {
        const pattern = open.repeat(depth) + 'a,b' + ending;
        for (const method of ['parse', 'compile', 'expand', 'stringify']) {
          const expected = pattern.length <= 10000 ? /nesting/ : /max characters/;
          assert.throws(() => braces[method](pattern), (error) => error instanceof SyntaxError && expected.test(error.message));
        }
      }
    }
  }
  // Verify the exact compatibility boundary and every public string entry point.
  for (const [open, close] of [['{', '}'], ['(', ')']]) {
    for (const depth of [127, 128]) {
      const pattern = open.repeat(depth) + 'a,b' + close.repeat(depth);
      for (const method of ['parse', 'compile', 'expand', 'stringify']) {
        assert.doesNotThrow(() => braces[method](pattern));
      }
    }
    // 9999 characters stays below the separate length cap. The unpatched
    // recursive expand/stringify APIs overflowed the stack on these patterns.
    const belowLengthCap = open.repeat(4999) + 'x' + close.repeat(4999);
    for (const method of ['parse', 'compile', 'expand', 'stringify']) {
      assert.throws(() => braces[method](belowLengthCap), (error) => error instanceof SyntaxError && /nesting/.test(error.message));
    }
    const nested = open.repeat(129) + 'a,b' + close.repeat(129);
    for (const run of [
      () => braces(nested), () => braces.create(nested),
      () => braces(nested, { expand: true }), () => braces([nested]),
      () => braces(nested, { maxLength: Infinity }),
    ]) assert.throws(run, (error) => error instanceof SyntaxError && /nesting/.test(error.message));
  }
  // Escaped delimiters, quoted text and many shallow groups remain valid.
  assert.ok(braces.compile('\\{literal\\}'));
  assert.ok(braces.compile('"' + '{'.repeat(1000) + '"'));
  assert.ok(braces.compile('{a,b}'.repeat(1000)));
  assert.ok(braces.compile('[' + '{'.repeat(1000) + ']'));
}

function forgeChecks(forge) {
  const { asn1 } = forge;
  const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const nullValue = () => asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '');
  const sequence = (values) => asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, values);
  for (const algorithm of ['sha256', 'sha512', 'md5']) {
    const md = forge.md[algorithm].create().update('local synthetic regression fixture');
    const digest = md.digest().getBytes();
    assert.equal(publicKey.verify(digest, privateKey.sign(md)), true);
    assert.equal(publicKey.verify('wrong digest', privateKey.sign(md)), false);
    const oid = () => asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
      asn1.oidToDer(forge.oids[algorithm]).getBytes());
    const sign = (fields) => privateKey.sign(asn1.toDer(sequence([
      sequence(fields), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, digest),
    ])).getBytes(), 'NONE');
    // SHA-2 permits an absent NULL parameter; retain that interoperability.
    if (algorithm !== 'md5') assert.equal(publicKey.verify(digest, sign([oid()])), true);
    for (const fields of [
      [oid(), nullValue(), nullValue()],
      [oid(), nullValue(), sequence([oid()])],
      [oid(), sequence([oid()])],
      [oid(), asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, 'invalid')],
    ]) {
      assert.throws(() => publicKey.verify(digest, sign(fields)), /DigestInfo/,
        'malformed DigestAlgorithm must not authenticate a signature');
    }
  }
}

function sprintfChecks({ sprintf, vsprintf }) {
  assert.equal(sprintf('%s: %04d %.2f', 'ok', 7, 1.25), 'ok: 0007 1.25');
  assert.equal(sprintf('%(item)s', { item: 'name' }), 'name');
  for (const pattern of ['%65537s', '%.65537s', '%999999999999999999s', '%.999999999999999999s']) {
    assert.throws(() => sprintf(pattern, 'x'), /format limit/);
  }
  assert.equal(sprintf('%65536s', 'x').length, 65536);
  const compatible = [
    ['%2$s %1$d', [7, 'ok'], 'ok 7'],
    ['%+08.2f', [3.5], '+0003.50'],
    ["%'_8s", ['x'], '_______x'],
    ['%-8s', ['x'], 'x       '],
    ['%(x.y[0])s', [{ x: { y: ['ok'] } }], 'ok'],
    ['%.65536s', ['x'.repeat(65537)], 'x'.repeat(65536)],
  ];
  for (const [pattern, args, expected] of compatible) {
    assert.equal(sprintf(pattern, ...args), expected);
    assert.equal(vsprintf(pattern, args), expected);
  }
  for (const format of [sprintf, (pattern, arg) => vsprintf(pattern, [arg])]) {
    let accesses = 0;
    const named = { get value() { accesses++; return 'x'; } };
    const coerced = { toString() { accesses++; return 'x'; } };
    for (const pattern of ['%(value)65537s', '%(value).65537s']) {
      assert.throws(() => format(pattern, named), /format limit/);
    }
    for (const pattern of ['%65537s', '%.65537s']) {
      assert.throws(() => format(pattern, coerced), /format limit/);
    }
    assert.equal(accesses, 0, 'reject oversized fields before property access or coercion');
  }
}

function deepmergeChecks(merge) {
  const poisoned = () => JSON.parse('{"__proto__":{"isAdmin":true}}');
  for (const [target, source] of [
    [poisoned(), {}],
    [Object.create(null), poisoned()],
    [poisoned(), poisoned()],
    [{ nested: poisoned() }, { nested: { label: 'safe' } }],
  ]) {
    const result = merge(target, source);
    for (const object of [result, result.nested].filter(Boolean)) {
      assert.equal(Object.getPrototypeOf(object), Object.prototype);
      assert.equal(object.isAdmin, undefined, 'untrusted properties must not become inherited');
      if (Object.hasOwn(object, '__proto__')) {
        assert.deepEqual(Object.getOwnPropertyDescriptor(object, '__proto__'), {
          value: { isAdmin: true }, enumerable: true, configurable: true, writable: true,
        });
      }
    }
  }
  const symbol = Symbol('metadata');
  const left = { nested: { a: 1 }, list: [{ x: 1 }], [symbol]: { a: 1 } };
  const result = merge(left, { nested: { b: 2 }, list: [2], [symbol]: { b: 2 } });
  assert.deepEqual(result, { nested: { a: 1, b: 2 }, list: [{ x: 1 }, 2], [symbol]: { a: 1, b: 2 } });
  assert.notEqual(result.nested, left.nested);
  assert.notEqual(result.list[0], left.list[0]);
  assert.deepEqual(merge({ list: [1] }, { list: [2] }, { arrayMerge: (_, source) => source }), { list: [2] });
  assert.deepEqual(merge({ count: 2 }, { count: 3 }, {
    isMergeableObject: () => true,
    customMerge: (key) => key === 'count' ? (a, b) => a + b : undefined,
  }), { count: 5 });
  assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }]), { a: 1, b: 2 });
  const nested = merge({ list: [poisoned()], nested: { inner: poisoned() } }, { list: [poisoned()] });
  for (const object of [...nested.list, nested.nested.inner]) {
    assert.equal(Object.getPrototypeOf(object), Object.prototype);
    assert.equal(object.isAdmin, undefined);
  }
  const shared = { label: 'safe' };
  const date = new Date('2026-11-17T00:00:00Z');
  const regexp = /safe/i;
  const uncloned = merge({}, { shared, date, regexp }, { clone: false });
  assert.equal(uncloned.shared, shared);
  assert.equal(uncloned.date, date);
  assert.equal(uncloned.regexp, regexp);
  const constructorPayload = JSON.parse('{"constructor":{"prototype":{"isAdmin":true}}}');
  const safe = merge({}, constructorPayload);
  assert.equal(Object.getPrototypeOf(safe), Object.prototype);
  assert.equal(safe.isAdmin, undefined);
  assert.equal({}.isAdmin, undefined);
}

module.exports = { bracesChecks, forgeChecks, sprintfChecks, deepmergeChecks };
