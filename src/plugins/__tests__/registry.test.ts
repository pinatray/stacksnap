import { PluginRegistryImpl } from '../registry';
import { captureAll, restoreAll } from '../loader';
import { registry } from '../registry';
import { Plugin, PluginSnapshot } from '../types';

const makePlugin = (name: string, data: Record<string, unknown> = {}): Plugin => ({
  name,
  description: `Test plugin: ${name}`,
  capture: async (): Promise<PluginSnapshot> => ({
    plugin: name,
    version: '1.0.0',
    capturedAt: new Date().toISOString(),
    data,
  }),
  restore: jest.fn(async () => {}),
});

describe('PluginRegistry', () => {
  let reg: PluginRegistryImpl;

  beforeEach(() => {
    reg = new PluginRegistryImpl();
  });

  it('registers a plugin successfully', () => {
    const plugin = makePlugin('git');
    reg.register(plugin);
    expect(reg.has('git')).toBe(true);
  });

  it('throws on duplicate plugin registration', () => {
    reg.register(makePlugin('git'));
    expect(() => reg.register(makePlugin('git'))).toThrow('already registered');
  });

  it('throws if plugin has no name', () => {
    expect(() => reg.register({ ...makePlugin(''), name: '' })).toThrow('valid name');
  });

  it('lists all registered plugins', () => {
    reg.register(makePlugin('git'));
    reg.register(makePlugin('npm'));
    expect(reg.list()).toHaveLength(2);
  });

  it('returns undefined for unknown plugin', () => {
    expect(reg.get('unknown')).toBeUndefined();
  });

  it('unregisters a plugin', () => {
    reg.register(makePlugin('git'));
    reg.unregister('git');
    expect(reg.has('git')).toBe(false);
  });
});

describe('captureAll and restoreAll', () => {
  beforeEach(() => {
    registry.clear();
  });

  it('captures snapshots from all plugins', async () => {
    registry.register(makePlugin('git', { user: 'alice' }));
    registry.register(makePlugin('npm', { registry: 'https://registry.npmjs.org' }));
    const snapshots = await captureAll();
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].plugin).toBe('git');
  });

  it('returns empty array when no plugins registered', async () => {
    const snapshots = await captureAll();
    expect(snapshots).toEqual([]);
  });

  it('restores snapshots using matching plugins', async () => {
    const restoreMock = jest.fn(async () => {});
    const plugin = { ...makePlugin('git'), restore: restoreMock };
    registry.register(plugin);
    const snapshot: PluginSnapshot = {
      plugin: 'git',
      version: '1.0.0',
      capturedAt: new Date().toISOString(),
      data: { user: 'alice' },
    };
    await restoreAll([snapshot]);
    expect(restoreMock).toHaveBeenCalledWith(snapshot);
  });

  it('skips restore for unknown plugin', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const snapshot: PluginSnapshot = { plugin: 'unknown', version: '1.0.0', capturedAt: '', data: {} };
    await restoreAll([snapshot]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No plugin found'));
    consoleSpy.mockRestore();
  });
});
