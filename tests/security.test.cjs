const test = require('node:test');
const { bracesChecks, forgeChecks, sprintfChecks } = require('../scripts/security-regressions.cjs');
test('glob parser bounds recursive work while retaining normal patterns', () => bracesChecks(require('braces')));
test('RSA verifies valid signatures and rejects malformed DigestAlgorithm fields', () => forgeChecks(require('node-forge')));
test('formatting preserves normal output and bounds precision/width', () => sprintfChecks(require('sprintf-js')));
