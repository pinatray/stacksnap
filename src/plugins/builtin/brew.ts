import { Plugin, PluginContext, CaptureResult, RestoreResult } from '../types';
import { execSync } from 'child_process';

function runCommand(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

function isBrewAvailable(): boolean {
  try {
    runCommand('which brew');
    return true;
  } catch {
    return false;
  }
}

const brewPlugin: Plugin = {
  name: 'brew',
  description: 'Captures and restores Homebrew packages and casks',

  async capture(ctx: PluginContext): Promise<CaptureResult> {
    if (!isBrewAvailable()) {
      return { success: false, error: 'Homebrew is not installed or not in PATH' };
    }

    try {
      const formulae = runCommand('brew list --formula').split('\n').filter(Boolean);
      const casks = runCommand('brew list --cask').split('\n').filter(Boolean);

      ctx.logger?.debug(`Captured ${formulae.length} formulae and ${casks.length} casks`);

      return {
        success: true,
        data: { formulae, casks },
      };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },

  async restore(ctx: PluginContext): Promise<RestoreResult> {
    if (!isBrewAvailable()) {
      return { success: false, error: 'Homebrew is not installed or not in PATH' };
    }

    const { formulae = [], casks = [] } = (ctx.config ?? {}) as {
      formulae?: string[];
      casks?: string[];
    };

    const installed: string[] = [];
    const failed: string[] = [];

    for (const pkg of formulae) {
      try {
        runCommand(`brew install ${pkg}`);
        installed.push(pkg);
      } catch {
        failed.push(pkg);
      }
    }

    for (const cask of casks) {
      try {
        runCommand(`brew install --cask ${cask}`);
        installed.push(cask);
      } catch {
        failed.push(cask);
      }
    }

    return {
      success: failed.length === 0,
      installed,
      failed,
    };
  },
};

export default brewPlugin;
