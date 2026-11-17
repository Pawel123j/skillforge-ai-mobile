const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { dirname, join } = require('node:path');
const { bracesChecks, forgeChecks, sprintfChecks, deepmergeChecks } = require('../scripts/security-regressions.cjs');
test('glob parser bounds recursive work while retaining normal patterns', () => bracesChecks(require('braces')));
test('RSA verifies valid signatures and rejects malformed DigestAlgorithm fields', () => forgeChecks(require('node-forge')));
test('formatting preserves normal output and bounds precision/width', () => sprintfChecks(require('sprintf-js')));
test('deep merge preserves data without changing result prototypes (CommonJS)', () => deepmergeChecks(require('deepmerge')));
test('deep merge preserves data without changing result prototypes (UMD)', () => deepmergeChecks(require('deepmerge/dist/umd')));

test('Expo CLI plugin validation remains compatible with the patched Zod major', () => {
  // Expo CLI requests Zod 3. Exercise its actual schemas under the Zod 4
  // override, including the dev-tools path not reached by a static export.
  const expoRequire = createRequire(require.resolve('expo/package.json'));
  const cliRoot = dirname(expoRequire.resolve('@expo/cli/package.json'));
  const { PluginSchema, DevToolsPluginOutputSchema } = require(join(cliRoot, 'build/src/start/server/DevToolsPlugin.schema.js'));
  const { createMCPDevToolsExtensionSchema } = require(join(cliRoot, 'build/src/start/server/createMCPDevToolsExtensionSchema.js'));
  const plugin = PluginSchema.parse({
    packageName: 'fixture-plugin', packageRoot: '/fixture',
    cliExtensions: {
      description: 'Compatibility fixture', entryPoint: 'commands.js',
      commands: [{ name: 'inspect', title: 'Inspect', environments: ['cli', 'mcp'],
        parameters: [
          { name: 'label', type: 'text' }, { name: 'count', type: 'number' },
          { name: 'confirm', type: 'confirm' },
        ] }],
    },
  });
  const schema = createMCPDevToolsExtensionSchema(plugin);
  assert.deepEqual(schema.parse({ command: 'inspect', label: 'fixture', count: 2, confirm: true }),
    { command: 'inspect', label: 'fixture', count: 2, confirm: true });
  for (const invalid of [{ command: 'unknown' }, { command: 'inspect', count: '2' },
    { command: 'inspect', extra: true }]) assert.equal(schema.safeParse(invalid).success, false);
  assert.equal(PluginSchema.safeParse({ packageName: '', packageRoot: '/fixture' }).success, false);
  assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'text', text: 'OK', level: 'info' }]).success, true);
  assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'image', url: 'invalid' }]).success, false);
});
