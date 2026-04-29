import { syncManifest, formatSyncResults, SyncResult } from '../sync';
import { PluginRegistry, Plugin } from '../../plugins/types';
import { Manifest } from '../../manifest/types';

const makeManifest = (): Manifest => ({
  version: '1.0.0',
  plugins: {},
});

const makePlugin = (name: string, shouldFail = false): Plugin => ({
  name,
  capture: jest.fn(async () => {
    if (shouldFail) throw new Error(`${name} capture failed`);
  }),
  restore: jest.fn(async () => {
    if (shouldFail) throw new Error(`${name} restore failed`);
  }),
});

const makeRegistry = (plugins: Plugin[]): PluginRegistry => ({
  register: jest.fn(),
  get: jest.fn((name) => plugins.find((p) => p.name === name)),
  list: jest.fn(() => plugins),
});

describe('syncManifest', () => {
  it('captures all plugins successfully', async () => {
    const plugins = [makePlugin('brew'), makePlugin('npm')];
    const registry = makeRegistry(plugins);
    const manifest = makeManifest();

    const results = await syncManifest(manifest, registry, { direction: 'capture' });

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
    expect(plugins[0].capture).toHaveBeenCalledWith(manifest, { dryRun: false });
    expect(plugins[1].capture).toHaveBeenCalledWith(manifest, { dryRun: false });
  });

  it('restores filtered plugins only', async () => {
    const plugins = [makePlugin('brew'), makePlugin('npm'), makePlugin('vscode')];
    const registry = makeRegistry(plugins);
    const manifest = makeManifest();

    const results = await syncManifest(manifest, registry, {
      direction: 'restore',
      plugins: ['brew', 'vscode'],
    });

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.plugin)).toEqual(['brew', 'vscode']);
    expect(plugins[1].restore).not.toHaveBeenCalled();
  });

  it('records errors without throwing', async () => {
    const plugins = [makePlugin('brew', true), makePlugin('npm')];
    const registry = makeRegistry(plugins);
    const manifest = makeManifest();

    const results = await syncManifest(manifest, registry, { direction: 'capture' });

    expect(results[0].success).toBe(false);
    expect(results[0].error).toBe('brew capture failed');
    expect(results[1].success).toBe(true);
  });

  it('skips execution in dry run mode', async () => {
    const plugins = [makePlugin('brew'), makePlugin('npm')];
    const registry = makeRegistry(plugins);
    const manifest = makeManifest();

    const results = await syncManifest(manifest, registry, { direction: 'capture', dryRun: true });

    expect(results.every((r) => r.success)).toBe(true);
    expect(plugins[0].capture).not.toHaveBeenCalled();
  });
});

describe('formatSyncResults', () => {
  it('formats results with success and failure indicators', () => {
    const results: SyncResult[] = [
      { plugin: 'brew', direction: 'capture', success: true },
      { plugin: 'npm', direction: 'capture', success: false, error: 'not found' },
    ];
    const output = formatSyncResults(results);
    expect(output).toContain('✓ brew');
    expect(output).toContain('✗ npm — not found');
    expect(output).toContain('1/2 plugins succeeded.');
  });
});
