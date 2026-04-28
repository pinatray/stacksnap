import { execSync } from "child_process";
import type { Plugin, PluginContext } from "../types";

export function runCommand(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

export function isGitAvailable(): boolean {
  try {
    runCommand("git --version");
    return true;
  } catch {
    return false;
  }
}

export function getGlobalGitConfig(): Record<string, string> {
  try {
    const output = runCommand("git config --global --list");
    const config: Record<string, string> = {};
    for (const line of output.split("\n")) {
      const idx = line.indexOf("=");
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        config[key] = value;
      }
    }
    return config;
  } catch {
    return {};
  }
}

const gitPlugin: Plugin = {
  name: "git",

  async capture(ctx: PluginContext) {
    if (!isGitAvailable()) {
      ctx.logger.warn("git is not available, skipping");
      return {};
    }
    const config = getGlobalGitConfig();
    ctx.logger.info(`Captured ${Object.keys(config).length} git config entries`);
    return { config };
  },

  async restore(ctx: PluginContext) {
    if (!isGitAvailable()) {
      ctx.logger.warn("git is not available, skipping restore");
      return;
    }
    const config = (ctx.manifest.plugins?.git?.config ?? {}) as Record<string, string>;
    for (const [key, value] of Object.entries(config)) {
      try {
        runCommand(`git config --global ${key} "${value}"`);
        ctx.logger.info(`Set git config: ${key}=${value}`);
      } catch (err) {
        ctx.logger.warn(`Failed to set git config ${key}: ${(err as Error).message}`);
      }
    }
  },
};

export default gitPlugin;
