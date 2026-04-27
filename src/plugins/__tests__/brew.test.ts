import { execSync } from 'child_process';
import brewPlugin from '../builtin/brew';
import { PluginContext } from '../types';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

const mockExec = execSync as jest.MockedFunction<typeof execSync>;

function makeCtx(config?: Record<string, unknown>): PluginContext {
  return {
    config,
    logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
}

describe('brewPlugin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('has correct name and description', () => {
    expect(brewPlugin.name).toBe('brew');
    expect(brewPlugin.description).toBeTruthy();
  });

  describe('capture', () => {
    it('returns success with formulae and casks', async () => {
      mockExec
        .mockReturnValueOnce('brew' as any)          // which brew
        .mockReturnValueOnce('git\ncurl\nnode' as any) // brew list --formula
        .mockReturnValueOnce('iterm2\nvscode' as any); // brew list --cask

      const result = await brewPlugin.capture(makeCtx());

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        formulae: ['git', 'curl', 'node'],
        casks: ['iterm2', 'vscode'],
      });
    });

    it('returns failure when brew is not available', async () => {
      mockExec.mockImplementationOnce(() => { throw new Error('not found'); });

      const result = await brewPlugin.capture(makeCtx());

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not installed/i);
    });
  });

  describe('restore', () => {
    it('installs all formulae and casks', async () => {
      mockExec.mockReturnValue('brew' as any); // all commands succeed

      const ctx = makeCtx({ formulae: ['git', 'node'], casks: ['iterm2'] });
      const result = await brewPlugin.restore(ctx);

      expect(result.success).toBe(true);
      expect(result.installed).toEqual(expect.arrayContaining(['git', 'node', 'iterm2']));
      expect(result.failed).toHaveLength(0);
    });

    it('reports failed packages without throwing', async () => {
      mockExec
        .mockReturnValueOnce('brew' as any)           // which brew
        .mockImplementationOnce(() => { throw new Error('install failed'); }) // git fails
        .mockReturnValueOnce('' as any);              // node succeeds

      const ctx = makeCtx({ formulae: ['git', 'node'], casks: [] });
      const result = await brewPlugin.restore(ctx);

      expect(result.success).toBe(false);
      expect(result.failed).toContain('git');
      expect(result.installed).toContain('node');
    });

    it('returns failure when brew is not available', async () => {
      mockExec.mockImplementationOnce(() => { throw new Error('not found'); });

      const result = await brewPlugin.restore(makeCtx({}));

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not installed/i);
    });
  });
});
