import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const patches = require('./security-patches.json');
const { bracesChecks, sprintfChecks, deepmergeChecks } = require('./security-regressions.cjs');
const reviewed = {
  braces: ['https://github.com/advisories/GHSA-vfj7-8cjw-p6xm', bracesChecks],
  'sprintf-js': ['https://github.com/advisories/GHSA-hp3w-g68c-fv3c', sprintfChecks],
  deepmerge: ['https://github.com/advisories/GHSA-gcqx-w48m-w2h4', deepmergeChecks],
};
const npm = process.env.npm_execpath;
const audit = spawnSync(npm ? process.execPath : 'npm', npm ? [npm, 'audit', '--json'] : ['audit', '--json'], {
  encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024, shell: false,
});
assert.ok(!audit.error && [0, 1].includes(audit.status) && audit.stdout, 'npm audit unavailable; fail closed');
const report = JSON.parse(audit.stdout);
assert.ok(!report.error && report.vulnerabilities && report.metadata, 'invalid audit result');
const verified = new Set();
function verify(name, node) {
  if (verified.has(node)) return;
  assert.ok(new Date().toISOString().slice(0, 10) < '2026-12-17', 'local security patches require upstream review');
  const location = resolve(node);
  assert.ok(location.startsWith(resolve('node_modules') + sep), 'unexpected package location');
  const patch = patches[name];
  const pkg = JSON.parse(readFileSync(resolve(location, 'package.json'), 'utf8'));
  assert.equal(pkg.name, name);
  assert.equal(pkg.version, patch.version);
  for (const [file, hash] of Object.entries(patch.files ?? { [patch.file]: patch.sha256 })) {
    const bytes = readFileSync(resolve(location, file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, 'missing or altered patch');
  }
  reviewed[name][1](require(location));
  verified.add(node);
}
// Verify every locked copy even if the advisory feed temporarily omits a finding.
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
for (const name of Object.keys(patches)) {
  const locations = Object.keys(lock.packages).filter((node) =>
    node === `node_modules/${name}` || node.endsWith(`/node_modules/${name}`));
  assert.ok(locations.length, `patched dependency ${name} is missing; review and retire its exception`);
  for (const node of locations) verify(name, node);
}
const failures = [];
for (const vulnerability of Object.values(report.vulnerabilities)) {
  for (const advisory of vulnerability.via) {
    if (typeof advisory !== 'object') continue;
    const allowed = reviewed[vulnerability.name];
    if (allowed && advisory.url === allowed[0] && vulnerability.nodes.length) {
      for (const node of vulnerability.nodes) verify(vulnerability.name, node);
    } else failures.push(`${advisory.severity}: ${advisory.name}: ${advisory.url}`);
  }
}
assert.equal(failures.length, 0, `Unmitigated findings:\n${[...new Set(failures)].join('\n')}`);
console.log(`PASS: ${verified.size} patched installations verified by hash and adversarial/compatibility regressions.`);
console.log('Raw npm audit (includes locally patched findings):', report.metadata.vulnerabilities);
