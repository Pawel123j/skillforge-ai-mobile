# SDK 58 dependency security

Validated on 2026-10-19 with Expo 58.0.14, React Native 0.88.0 and React 19.3.0.
Use Node 22.13+ or 24.3+ within the ranges in `package.json`, then `npm ci`.
The old SDK 51 CLI patch is retired: SDK 58 uses `multitars`. Its extraction,
template digest, parent-path and external-symlink regressions are in
`tests/toolchain.test.cjs`. `tar` 7.5.22 remains only as a test-fixture writer.

Three advisories still affect the latest upstream releases. Do not describe raw
`npm audit` as clean. `patch-package` is retained for these specific mitigations:

| Dependency | Advisory | Mitigation |
| --- | --- | --- |
| braces 3.0.3 | GHSA-vfj7-8cjw-p6xm | Reject recursive AST nesting beyond 128 before compiling or expanding. |
| node-forge 1.4.0 | GHSA-86w9-cpqp-85rv | Enforce the exact DigestAlgorithm element count and empty optional NULL parameters before verifying PKCS#1 v1.5 signatures. |
| sprintf-js 1.1.3 | GHSA-hp3w-g68c-fv3c | Bound each width and precision to 65536 before formatting. |

The CommonJS-compatible uuid 11.1.1 override fixes GHSA-w5hq-g745-h8pq in the
Xcode project tooling. All installed versions are locked. Normal patterns,
escaped/shallow globs, SHA-256/SHA-512/MD5 valid signatures, SHA-2 omitted-NULL
encoding and ordinary formatter output have compatibility assertions.

`npm run security:check` obtains a fresh full npm audit, verifies the version and
SHA-256 of **every reported patched installation**, and runs adversarial and
compatibility checks. Unexpected advisories of any severity, a missing/altered
patch, unavailable audit or **2026-11-18** review deadline fail the gate. CI uses
this gate. It is a time-limited mitigation, not an upstream fix or a zero-audit
claim. Review upstream releases before the deadline and migrate with regressions;
do not extend or suppress the exception without a new assessment.

Run `npm run test:security` for the local regressions without a registry request.
The stage-3 evidence preserves their failure on unpatched dependencies and success
after patching. Native release signing and device execution remain separate checks.
