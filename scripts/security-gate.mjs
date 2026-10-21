import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const patches = require('./security-patches.json');
const { bracesChecks, forgeChecks, sprintfChecks } = require('./security-regressions.cjs');
const reviewed = {
  braces: ['https://github.com/advisories/GHSA-vfj7-8cjw-p6xm', bracesChecks],
  'node-forge': ['https://github.com/advisories/GHSA-86w9-cpqp-85rv', forgeChecks],
  'sprintf-js': ['https://github.com/advisories/GHSA-hp3w-g68c-fv3c', sprintfChecks],
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
  assert.ok(new Date().toISOString().slice(0, 10) < '2026-11-18', 'local security patches require upstream review');
  const location = resolve(node);
  assert.ok(location.startsWith(resolve('node_modules') + sep), 'unexpected package location');
  const patch = patches[name];
  const pkg = JSON.parse(readFileSync(resolve(location, 'package.json'), 'utf8'));
  assert.equal(pkg.name, name);
  assert.equal(pkg.version, patch.version);
  const bytes = readFileSync(resolve(location, patch.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), patch.sha256, 'missing or altered patch');
  reviewed[name][1](require(location));
  verified.add(node);
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
