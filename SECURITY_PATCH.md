# SDK 58 dependency security

Reviewed again on **2026-11-17** with Node 24.19.0 and a clean `npm ci`.
The app uses Expo 58.0.14, React Native 0.88.0 and React 19.3.0.
Use a Node version within the ranges in `package.json`; CI uses Node 24.

The registry still publishes braces 3.0.3, sprintf-js 1.1.3 and deepmerge 4.3.1
as latest. Their narrowly scoped source mitigations remain necessary:

| Dependency | Advisory | Mitigation |
| --- | --- | --- |
| braces 3.0.3 | GHSA-vfj7-8cjw-p6xm | Reject AST nesting beyond 128 for string patterns before recursive processing. |
| sprintf-js 1.1.3 | GHSA-hp3w-g68c-fv3c | Bound each width/precision to 65536 before property access, coercion or allocation. |
| deepmerge 4.3.1 | GHSA-gcqx-w48m-w2h4 | Define own data properties instead of invoking inherited setters; cover source, CJS and UMD. |

The obsolete node-forge patch is retired: **1.4.3 contains the upstream fix**.
RSA regressions still check valid SHA-256/SHA-512/MD5 signatures, SHA-2 omitted
NULL encoding and rejection of malformed DigestAlgorithm parameters. The uuid
11.1.1 override retains CommonJS compatibility. Expo CLI's actual plugin schemas
are exercised under the Zod 4 override.

## Review evidence

Independent differential checks in memory reproduced the unpatched defects:
4999 nested delimiters overflow the braces stack below its length cap; sprintf
allocates a 65537-character field; deepmerge creates inherited `isAdmin` from an
own `__proto__` key. The patched versions reject the excessive work and retain
normal object prototypes. Source, CJS and UMD deepmerge were reviewed; the source
check used its identical bundled mergeability helper without installing packages.

Persistent regressions cover braces boundaries 127/128/129, unfinished/mismatched
input, public string APIs and ordinary patterns; sprintf and vsprintf positional
and named fields, padding, exact precision limit and rejection before getters or
coercion; deepmerge CJS/UMD nested objects/arrays, symbols, custom/array merges,
merge.all and clone:false reference compatibility. These are focused mitigations,
not a promise to accept arbitrary untrusted prebuilt ASTs or unlimited formats.

`npm run security:check` queries the full npm audit and verifies package versions
and SHA-256 hashes for **every locked copy**, plus copies reported by the feed.
The exact files/hashes are in `scripts/security-patches.json`. Hash and behavioral
checks run even when the feed is empty. Any unexpected advisory severity,
missing/altered patch, unavailable audit or **2026-12-17** review deadline fails.
`npm run test:security` additionally tests these failure paths with synthetic
feeds; this does not substitute for the live registry audit.

The fresh Nov 17 raw audit reported **zero findings**, compared with seven low
findings on Nov 11. Feed changes do not establish an upstream source fix: the
patches remain mandatory. The new assessment supports review before Dec 17;
remove each patch when a compatible upstream fix exists. Do not extend the
exception without reassessment. Native signing/device execution remain unverified.

## SkillForge integration

The same reviewed patch bytes and regressions are used here. Zod 4.6.7,
node-forge 1.4.3, glob >=9 overridden to 14.0.4 and minimatch >=7 to 11.0.5
address current findings. The unused Babel root search option was removed for
glob compatibility; aliases remain. See RECOVERY_STATUS.md for the unresolved
browser hydration failure; a zero audit does not establish application readiness.
