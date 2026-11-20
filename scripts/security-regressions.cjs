const assert = require('node:assert/strict');

function bracesChecks(braces) {
  assert.deepEqual(braces.expand('src/{app,components}/**/*.{ts,tsx}'), [
    'src/app/**/*.ts', 'src/app/**/*.tsx', 'src/components/**/*.ts', 'src/components/**/*.tsx',
  ]);
  assert.deepEqual(braces.expand('v{1..3}'), ['v1', 'v2', 'v3']);
  for (const [open, close] of [['{', '}'], ['(', ')'], ['{(', ')}']]) {
    for (const depth of [129, 4000, 10000]) {
      for (const ending of [close.repeat(depth), '']) {
        for (const method of ['parse', 'compile', 'expand', 'stringify']) {
          assert.throws(() => braces[method](open.repeat(depth) + 'a,b' + ending),
            (error) => error instanceof SyntaxError && /nesting|max characters/.test(error.message));
        }
      }
    }
  }
  assert.ok(braces.compile('\\{literal\\}'));
  assert.ok(braces.compile('"' + '{'.repeat(1000) + '"'));
  assert.ok(braces.compile('{a,b}'.repeat(1000)));
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

function sprintfChecks({ sprintf }) {
  assert.equal(sprintf('%s: %04d %.2f', 'ok', 7, 1.25), 'ok: 0007 1.25');
  assert.equal(sprintf('%(item)s', { item: 'name' }), 'name');
  for (const pattern of ['%65537s', '%.65537s', '%999999999999999999s', '%.999999999999999999s']) {
    assert.throws(() => sprintf(pattern, 'x'), /format limit/);
  }
  assert.equal(sprintf('%65536s', 'x').length, 65536);
}

module.exports = { bracesChecks, forgeChecks, sprintfChecks };
