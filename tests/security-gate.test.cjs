/* global __dirname */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const test = require('node:test');

const root = resolve(__dirname, '..');
const patches = require('../scripts/security-patches.json');
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));

// Real installed patch bytes, but a synthetic advisory feed: these tests prove
// gate behavior, not registry availability or absence of other vulnerabilities.
function runGate({ vulnerabilities = {}, altered, nested = false, auditExit = 0, date = '2026-11-17' } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'orbit-security-gate-'));
  try {
    mkdirSync(join(directory, 'scripts'));
    for (const file of ['security-gate.mjs', 'security-regressions.cjs', 'security-patches.json']) {
      copyFileSync(join(root, 'scripts', file), join(directory, 'scripts', file));
    }
    const fixtureLock = structuredClone(lock);
    for (const name of Object.keys(patches)) {
      for (const node of Object.keys(lock.packages).filter(node =>
        node === `node_modules/${name}` || node.endsWith(`/node_modules/${name}`))) {
        const destination = join(directory, node);
        mkdirSync(resolve(destination, '..'), { recursive: true });
        if (name === altered) {
          cpSync(join(root, node), destination, { recursive: true });
          const patch = patches[name];
          const file = patch.file ?? Object.keys(patch.files)[0];
          writeFileSync(join(destination, file), '// altered patch\n');
        } else symlinkSync(join(root, node), destination, 'dir');
      }
    }
    if (nested) {
      const node = 'node_modules/fixture/node_modules/braces';
      fixtureLock.packages[node] = { version: '3.0.3' };
      mkdirSync(join(directory, node, 'lib'), { recursive: true });
      writeFileSync(join(directory, node, 'package.json'), JSON.stringify({ name: 'braces', version: '3.0.3' }));
      writeFileSync(join(directory, node, 'lib/parse.js'), '// unpatched nested copy\n');
    }
    writeFileSync(join(directory, 'package-lock.json'), JSON.stringify(fixtureLock));
    const audit = join(directory, 'audit.cjs');
    writeFileSync(audit, `console.log(${JSON.stringify(JSON.stringify({ vulnerabilities, metadata: { vulnerabilities: {} } }))}); process.exit(${auditExit});\n`);
    const clock = join(directory, 'clock.cjs');
    writeFileSync(clock, `const RealDate = Date; global.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [${JSON.stringify(date + 'T12:00:00Z')}])) } };\n`);
    const result = spawnSync(process.execPath, ['--require', clock, 'scripts/security-gate.mjs'], {
      cwd: directory, env: { ...process.env, npm_execpath: audit }, encoding: 'utf8', timeout: 15000,
    });
    assert.equal(result.error, undefined);
    return result;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('empty feed still requires all three verified patches', () => {
  const result = runGate();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /3 patched installations verified/);
});
for (const name of Object.keys(patches)) {
  test(`empty feed cannot hide an altered ${name} patch`, () => {
    const result = runGate({ altered: name });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing or altered patch/);
  });
}
test('empty feed cannot hide an unpatched nested locked copy', () => {
  const result = runGate({ nested: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing or altered patch/);
});
for (const severity of ['info', 'low', 'moderate', 'high', 'critical', 'unknown']) {
  test(`unmitigated ${severity} findings fail closed`, () => {
    const result = runGate({ vulnerabilities: { fixture: {
      name: 'fixture', nodes: ['node_modules/fixture'],
      via: [{ name: 'fixture', severity, url: 'https://github.com/advisories/GHSA-test-unmitigated' }],
    } } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unmitigated findings/);
  });
}
test('expired patches fail even with an empty feed', () => {
  const result = runGate({ date: '2026-12-17' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /require upstream review/);
});
test('audit process failure cannot approve plausible output', () => {
  const result = runGate({ auditExit: 2 });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /npm audit unavailable/);
});
