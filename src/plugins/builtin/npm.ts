import { execSync } from 'child_process';
import { Plugin, PluginContext } from '../types';

export function runCommand(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

export function isNpmAvailable(): boolean {
  try {
    runCommand('npm --version');
    return true;
  } catch {
    return false;
  }
}

export function getGlobalPackages(): string[] {
  try {
    const output = runCommand('npm list -g --depth=0 --json');
    const parsed = JSON.parse(output);
    return Object.keys(parsed.dependencies ?? {});
  } catch {
    return [];
  }
}

const npmPlugin: Plugin = {
  name: 'npm',
  description: 'Manages global npm packages',

  async capture(ctx: PluginContext): Promise<void> {
    if (!isNpmAvailable()) {
      ctx.logger.warn('npm is not available on this system');
      return;
    }
    const packages = getGlobalPackages();
    ctx.manifest.packages = ctx.manifest.packages ?? {};
    ctx.manifest.packages.npm = packages;
    ctx.logger.info(`Captured ${packages.length} global npm package(s)`);
  },

  async restore(ctx: PluginContext): Promise<void> {
    if (!isNpmAvailable()) {
      ctx.logger.warn('npm is not available — skipping npm restore');
      return;
    }
    const packages: string[] = ctx.manifest.packages?.npm ?? [];
    if (packages.length === 0) {
      ctx.logger.info('No npm packages to restore');
      return;
    }
    for (const pkg of packages) {
      try {
        ctx.logger.info(`Installing npm package: ${pkg}`);
        runCommand(`npm install -g ${pkg}`);
      } catch (err) {
        ctx.logger.error(`Failed to install npm package "${pkg}": ${(err as Error).message}`);
      }
    }
  },
};

export default npmPlugin;
