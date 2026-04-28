import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginContext } from '../types';
import { Manifest } from '../../manifest/types';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';
import { isNpmAvailable, getGlobalPackages } from '../builtin/npm';
import npmPlugin from '../builtin/npm';

const makeCtx = (manifest: Partial<Manifest> = {}): PluginContext => ({
  manifest: manifest as Manifest,
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isNpmAvailable', () => {
  it('returns true when npm is installed', () => {
    vi.mocked(execSync).mockReturnValue('10.0.0' as any);
    expect(isNpmAvailable()).toBe(true);
  });

  it('returns false when npm is not found', () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not found'); });
    expect(isNpmAvailable()).toBe(false);
  });
});

describe('getGlobalPackages', () => {
  it('parses npm list output correctly', () => {
    const mockOutput = JSON.stringify({ dependencies: { typescript: {}, eslint: {} } });
    vi.mocked(execSync).mockReturnValue(mockOutput as any);
    expect(getGlobalPackages()).toEqual(['typescript', 'eslint']);
  });

  it('returns empty array on error', () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('fail'); });
    expect(getGlobalPackages()).toEqual([]);
  });
});

describe('npmPlugin.capture', () => {
  it('stores global packages in manifest', async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce('10.0.0' as any)
      .mockReturnValueOnce(JSON.stringify({ dependencies: { prettier: {} } }) as any);
    const ctx = makeCtx({});
    await npmPlugin.capture(ctx);
    expect(ctx.manifest.packages?.npm).toEqual(['prettier']);
  });

  it('warns and returns early when npm unavailable', async () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error(); });
    const ctx = makeCtx({});
    await npmPlugin.capture(ctx);
    expect(ctx.logger.warn).toHaveBeenCalled();
    expect(ctx.manifest.packages).toBeUndefined();
  });
});

describe('npmPlugin.restore', () => {
  it('installs packages listed in manifest', async () => {
    vi.mocked(execSync).mockReturnValue('' as any);
    const ctx = makeCtx({ packages: { npm: ['prettier', 'typescript'] } });
    await npmPlugin.restore(ctx);
    expect(execSync).toHaveBeenCalledWith('npm install -g prettier', expect.any(Object));
    expect(execSync).toHaveBeenCalledWith('npm install -g typescript', expect.any(Object));
  });

  it('logs error for failed package install without stopping', async () => {
    vi.mocked(execSync)
      .mockReturnValueOnce('10.0.0' as any)
      .mockImplementationOnce(() => { throw new Error('network error'); });
    const ctx = makeCtx({ packages: { npm: ['bad-pkg'] } });
    await npmPlugin.restore(ctx);
    expect(ctx.logger.error).toHaveBeenCalled();
  });
});
