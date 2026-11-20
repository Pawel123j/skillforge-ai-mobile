const test = require('node:test');
const { Buffer } = require('node:buffer');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const tar = require('tar');

// Resolve the CLI belonging to Expo, including npm's nested installation layout.
const cli = path.dirname(require.resolve('@expo/cli/package.json', {
  paths: [path.dirname(require.resolve('expo/package.json'))],
}));
const { extractLocalNpmTarballAsync } = require(path.join(cli, 'build/src/utils/npm'));
const { extractAsync } = require(path.join(cli, 'build/src/utils/tar'));

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'skillforge-sdk-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source');
  const output = path.join(root, 'output');
  await fs.mkdir(path.join(source, 'package'), { recursive: true });
  await fs.mkdir(output);
  await fs.writeFile(path.join(source, 'package', 'hello.txt'), 'template content\n');
  const archive = path.join(root, 'fixture.tgz');
  await tar.create({ file: archive, cwd: source, gzip: true }, ['package']);
  return { root, output, archive };
}

test('SDK 58 extracts npm templates and produces their digest', async (t) => {
  const { output, archive } = await fixture(t);
  const digest = await extractLocalNpmTarballAsync(archive, output, { expName: 'Fixture' });
  assert.match(digest, /^[a-f0-9]{32}$/);
  assert.equal(await fs.readFile(path.join(output, 'hello.txt'), 'utf8'), 'template content\n');
});

test('SDK 58 extracts archives with its portable JavaScript implementation', async (t) => {
  const { output, archive } = await fixture(t);
  await extractAsync(archive, output);
  assert.equal(await fs.readFile(path.join(output, 'package', 'hello.txt'), 'utf8'), 'template content\n');
});

for (const kind of ['parent path', 'outside symlink']) {
  test(`template extractor rejects ${kind} without writing outside destination`, async (t) => {
    const { root, output } = await fixture(t);
    const header = new tar.Header(kind === 'parent path'
      ? { path: '../escape.txt', size: 5, mode: 0o644, type: 'File' }
      : { path: 'escape', size: 0, mode: 0o644, type: 'SymbolicLink', linkpath: '../escape.txt' });
    header.encode();
    const archive = path.join(root, 'adversarial.tgz');
    const payload = kind === 'parent path' ? [Buffer.from('hello'), Buffer.alloc(507)] : [];
    await fs.writeFile(archive, gzipSync(Buffer.concat([header.block, ...payload, Buffer.alloc(1024)])));
    await extractLocalNpmTarballAsync(archive, output, { strip: 0, expName: 'Fixture' });
    await assert.rejects(fs.stat(path.join(root, 'escape.txt')), { code: 'ENOENT' });
    assert.deepEqual(await fs.readdir(output), []);
  });
}
