import { describe, it, expect, vi, beforeEach } from 'vitest';
import shellPlugin from '../builtin/shell';
import { PluginContext } from '../types';
import * as child_process from 'child_process';

vi.mock('child_process');

function makeCtx(config: Record<string, unknown> = {}): PluginContext {
  return {
    config,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as unknown as PluginContext;
}

describe('shell plugin', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.SHELL = '/bin/zsh';
    process.env.HOME = '/home/user';
  });

  describe('capture', () => {
    it('returns shell and aliases when shell is available', async () => {
      vi.spyOn(child_process, 'execSync')
        .mockReturnValueOnce('/bin/zsh') // which zsh
        .mockReturnValueOnce("alias gs='git status'\nalias ll='ls -la'\n"); // cat rcFile

      const ctx = makeCtx();
      const result = await shellPlugin.capture(ctx);

      expect(result).toMatchObject({
        shell: 'zsh',
        rcFile: '/home/user/.zshrc',
        aliases: {
          gs: 'git status',
          ll: 'ls -la',
        },
      });
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.stringContaining('2 aliases'));
    });

    it('warns and returns empty object when shell is not available', async () => {
      vi.spyOn(child_process, 'execSync').mockImplementationOnce(() => {
        throw new Error('not found');
      });

      const ctx = makeCtx();
      const result = await shellPlugin.capture(ctx);

      expect(result).toEqual({});
      expect(ctx.logger.warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });
  });

  describe('restore', () => {
    it('appends aliases to rc file when shell is available', async () => {
      const execSyncMock = vi.spyOn(child_process, 'execSync').mockReturnValue('') as ReturnType<typeof vi.spyOn>;

      const ctx = makeCtx({
        shell: 'zsh',
        rcFile: '/home/user/.zshrc',
        aliases: { gs: 'git status', ll: 'ls -la' },
      });

      await shellPlugin.restore(ctx);

      expect(execSyncMock).toHaveBeenCalledTimes(2); // which + grep/printf
      expect(ctx.logger.info).toHaveBeenCalledWith(expect.stringContaining('Restored 2 aliases'));
    });

    it('skips restore when aliases are empty', async () => {
      const execSyncMock = vi.spyOn(child_process, 'execSync').mockReturnValue('');

      const ctx = makeCtx({ shell: 'zsh', rcFile: '/home/user/.zshrc', aliases: {} });
      await shellPlugin.restore(ctx);

      expect(execSyncMock).not.toHaveBeenCalled();
      expect(ctx.logger.info).toHaveBeenCalledWith('No aliases to restore.');
    });

    it('warns when shell is not available during restore', async () => {
      vi.spyOn(child_process, 'execSync').mockImplementationOnce(() => {
        throw new Error('not found');
      });

      const ctx = makeCtx({
        shell: 'fish',
        rcFile: '/home/user/.config/fish/config.fish',
        aliases: { gs: 'git status' },
      });

      await shellPlugin.restore(ctx);

      expect(ctx.logger.warn).toHaveBeenCalledWith(expect.stringContaining('not available'));
    });
  });
});
