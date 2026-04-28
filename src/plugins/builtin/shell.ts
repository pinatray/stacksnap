import { Plugin, PluginContext } from '../types';
import { execSync } from 'child_process';

function runCommand(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function isShellAvailable(shell: string): boolean {
  try {
    runCommand(`which ${shell}`);
    return true;
  } catch {
    return false;
  }
}

function getShellAliases(shellRcPath: string): Record<string, string> {
  try {
    const content = runCommand(`cat ${shellRcPath}`);
    const aliases: Record<string, string> = {};
    const aliasRegex = /^alias\s+([\w.-]+)=['"](.+)['"]/gm;
    let match;
    while ((match = aliasRegex.exec(content)) !== null) {
      aliases[match[1]] = match[2];
    }
    return aliases;
  } catch {
    return {};
  }
}

const shellPlugin: Plugin = {
  name: 'shell',

  async capture(ctx: PluginContext) {
    const shell = process.env.SHELL?.split('/').pop() ?? 'bash';
    if (!isShellAvailable(shell)) {
      ctx.logger.warn(`Shell '${shell}' not found, skipping.`);
      return {};
    }

    const home = process.env.HOME ?? '~';
    const rcFile = shell === 'zsh' ? `${home}/.zshrc` : `${home}/.bashrc`;
    const aliases = getShellAliases(rcFile);

    ctx.logger.info(`Captured ${Object.keys(aliases).length} aliases from ${rcFile}`);
    return { shell, rcFile, aliases };
  },

  async restore(ctx: PluginContext) {
    const { shell, rcFile, aliases } = ctx.config as {
      shell: string;
      rcFile: string;
      aliases: Record<string, string>;
    };

    if (!aliases || Object.keys(aliases).length === 0) {
      ctx.logger.info('No aliases to restore.');
      return;
    }

    if (!isShellAvailable(shell)) {
      ctx.logger.warn(`Shell '${shell}' not available on this machine, skipping restore.`);
      return;
    }

    const lines = Object.entries(aliases)
      .map(([k, v]) => `alias ${k}='${v}'`)
      .join('\n');

    const marker = '# stacksnap:shell aliases';
    runCommand(
      `grep -q '${marker}' ${rcFile} || printf '\n${marker}\n${lines}\n' >> ${rcFile}`
    );

    ctx.logger.info(`Restored ${Object.keys(aliases).length} aliases to ${rcFile}`);
  },
};

export default shellPlugin;
