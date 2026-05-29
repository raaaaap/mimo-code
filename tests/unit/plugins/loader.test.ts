import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverPlugins } from '../../../src/plugins/loader.js';

const VALID_MANIFEST = {
  name: 'mimo-plugin-foo',
  version: '1.0.0',
  description: 'A test plugin',
  main: 'index.js',
  capabilities: ['command', 'tool'],
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'mimo-plugin-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('discoverPlugins', () => {
  it('returns empty array for non-existent directory', async () => {
    const result = await discoverPlugins('/non/existent/path');
    expect(result).toEqual([]);
  });

  it('returns empty array for directory with no plugins', async () => {
    const result = await discoverPlugins(tmpDir);
    expect(result).toEqual([]);
  });

  it('discovers a valid mimo-plugin-* package', async () => {
    const pluginDir = join(tmpDir, 'mimo-plugin-foo');
    await mkdir(pluginDir);
    await writeFile(join(pluginDir, 'manifest.json'), JSON.stringify(VALID_MANIFEST));

    const result = await discoverPlugins(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].manifest.name).toBe('mimo-plugin-foo');
    expect(result[0].dir).toBe(pluginDir);
  });

  it('discovers a valid @mimo-code/plugin-* package', async () => {
    const scopeDir = join(tmpDir, '@mimo-code');
    const pluginDir = join(scopeDir, 'plugin-bar');
    await mkdir(pluginDir, { recursive: true });
    await writeFile(
      join(pluginDir, 'manifest.json'),
      JSON.stringify({
        name: '@mimo-code/plugin-bar',
        version: '2.0.0',
        description: 'Scoped plugin',
        main: 'dist/index.js',
        capabilities: ['hook', 'theme'],
      }),
    );

    const result = await discoverPlugins(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].manifest.name).toBe('@mimo-code/plugin-bar');
  });

  it('skips directories without manifest.json', async () => {
    const pluginDir = join(tmpDir, 'mimo-plugin-no-manifest');
    await mkdir(pluginDir);
    await writeFile(join(pluginDir, 'index.js'), '// stub');

    const result = await discoverPlugins(tmpDir);
    expect(result).toEqual([]);
  });

  it('skips directories with invalid JSON in manifest', async () => {
    const pluginDir = join(tmpDir, 'mimo-plugin-bad-json');
    await mkdir(pluginDir);
    await writeFile(join(pluginDir, 'manifest.json'), '{not json}');

    const result = await discoverPlugins(tmpDir);
    expect(result).toEqual([]);
  });

  it('skips manifests missing required fields', async () => {
    const pluginDir = join(tmpDir, 'mimo-plugin-incomplete');
    await mkdir(pluginDir);
    await writeFile(
      join(pluginDir, 'manifest.json'),
      JSON.stringify({ name: 'mimo-plugin-incomplete' }),
    );

    const result = await discoverPlugins(tmpDir);
    expect(result).toEqual([]);
  });

  it('skips manifests with invalid capability values', async () => {
    const pluginDir = join(tmpDir, 'mimo-plugin-bad-cap');
    await mkdir(pluginDir);
    await writeFile(
      join(pluginDir, 'manifest.json'),
      JSON.stringify({
        ...VALID_MANIFEST,
        name: 'mimo-plugin-bad-cap',
        capabilities: ['command', 'invalid-cap'],
      }),
    );

    const result = await discoverPlugins(tmpDir);
    expect(result).toEqual([]);
  });

  it('skips regular files that match the naming pattern', async () => {
    await writeFile(join(tmpDir, 'mimo-plugin-file'), 'not a dir');

    const result = await discoverPlugins(tmpDir);
    expect(result).toEqual([]);
  });

  it('discovers multiple plugins at once', async () => {
    for (const name of ['mimo-plugin-a', 'mimo-plugin-b']) {
      const dir = join(tmpDir, name);
      await mkdir(dir);
      await writeFile(
        join(dir, 'manifest.json'),
        JSON.stringify({ ...VALID_MANIFEST, name }),
      );
    }

    const result = await discoverPlugins(tmpDir);
    expect(result).toHaveLength(2);
    const names = result.map((r) => r.manifest.name).sort();
    expect(names).toEqual(['mimo-plugin-a', 'mimo-plugin-b']);
  });

  it('ignores directories that do not match naming convention', async () => {
    const dir = join(tmpDir, 'some-other-package');
    await mkdir(dir);
    await writeFile(
      join(dir, 'manifest.json'),
      JSON.stringify(VALID_MANIFEST),
    );

    const result = await discoverPlugins(tmpDir);
    expect(result).toEqual([]);
  });

  it('parses all capability types correctly', async () => {
    const pluginDir = join(tmpDir, 'mimo-plugin-all-caps');
    await mkdir(pluginDir);
    await writeFile(
      join(pluginDir, 'manifest.json'),
      JSON.stringify({
        ...VALID_MANIFEST,
        name: 'mimo-plugin-all-caps',
        capabilities: ['command', 'tool', 'hook', 'theme'],
      }),
    );

    const result = await discoverPlugins(tmpDir);
    expect(result[0].manifest.capabilities).toEqual(['command', 'tool', 'hook', 'theme']);
  });
});
