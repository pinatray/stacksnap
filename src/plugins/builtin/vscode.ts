import { execSync } from "child_process";
import { Plugin, PluginContext } from "../types";

export function runCommand(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

export function isCodeAvailable(): boolean {
  try {
    runCommand("code --version");
    return true;
  } catch {
    return false;
  }
}

export function getInstalledExtensions(): string[] {
  const output = runCommand("code --list-extensions");
  return output.split("\n").filter(Boolean);
}

/**
 * Returns extensions present in `desired` but not in `installed`.
 */
export function getMissingExtensions(
  desired: string[],
  installed: Set<string>
): string[] {
  return desired.filter((ext) => !installed.has(ext));
}

const vscodePlugin: Plugin = {
  name: "vscode",

  async capture(ctx: PluginContext): Promise<void> {
    if (!isCodeAvailable()) {
      ctx.logger.warn("vscode: 'code' CLI not found, skipping");
      return;
    }

    const extensions = getInstalledExtensions();
    ctx.manifest.plugins.vscode = { extensions };
    ctx.logger.info(`vscode: captured ${extensions.length} extension(s)`);
  },

  async restore(ctx: PluginContext): Promise<void> {
    if (!isCodeAvailable()) {
      ctx.logger.warn("vscode: 'code' CLI not found, skipping");
      return;
    }

    const extensions: string[] = ctx.manifest.plugins.vscode?.extensions ?? [];
    if (extensions.length === 0) {
      ctx.logger.info("vscode: no extensions to restore");
      return;
    }

    const installed = new Set(getInstalledExtensions());
    const missing = getMissingExtensions(extensions, installed);

    if (missing.length === 0) {
      ctx.logger.info("vscode: all extensions already installed");
      return;
    }

    let count = 0;

    for (const ext of missing) {
      ctx.logger.info(`vscode: already installed ${ext}`);
      try {
        runCommand(`code --install-extension ${ext} --force`);
        ctx.logger.info(`vscode: installed ${ext}`);
        count++;
      } catch (err) {
        ctx.logger.error(`vscode: failed to install ${ext}: ${(err as Error).message}`);
      }
    }

    ctx.logger.info(`vscode: restored ${count} new extension(s)`);
  },
};

export default vscodePlugin;
