import { Command } from 'commander';
import * as path from 'path';
import { loadManifest } from '../../manifest';
import { PluginRegistryImpl } from '../../plugins';
import { registerBuiltinPlugins } from '../../plugins/builtin';
import { SyncResult } from '../../sync/types';
import { formatSyncResults } from '../../sync';

export function makeRestoreCommand(): Command {
  const cmd = new Command('restore');

  cmd
    .description('Restore dev environment from a manifest file')
    .option('-i, --input <file>', 'Input manifest file path', 'stacksnap.yaml')
    .option('--dry-run', 'Preview changes without applying them', false)
    .option('--plugins <plugins>', 'Comma-separated list of plugins to run (default: all)')
    .action(async (options) => {
      const inputPath = path.resolve(process.cwd(), options.input);

      let manifest;
      try {
        manifest = await loadManifest(inputPath);
        console.log(`Loaded manifest: ${inputPath}`);
      } catch (err) {
        console.error(`Failed to load manifest at ${inputPath}:`, err instanceof Error ? err.message : err);
        process.exitCode = 1;
        return;
      }

      if (options.dryRun) {
        console.log('\n--- DRY RUN MODE: no changes will be applied ---\n');
      }

      const registry = new PluginRegistryImpl();
      registerBuiltinPlugins(registry);

      const enabledPlugins = options.plugins
        ? options.plugins.split(',').map((p: string) => p.trim())
        : registry.list();

      const results: SyncResult[] = [];

      for (const pluginName of enabledPlugins) {
        const plugin = registry.get(pluginName);
        if (!plugin) {
          console.warn(`Plugin "${pluginName}" not found, skipping.`);
          continue;
        }

        const ctx = { manifest, dryRun: options.dryRun };
        try {
          const result = await plugin.restore(ctx);
          results.push(result);
        } catch (err) {
          results.push({
            plugin: pluginName,
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }

      console.log(formatSyncResults(results));

      const hasError = results.some((r) => r.status === 'error');
      if (hasError) {
        process.exitCode = 1;
      }
    });

  return cmd;
}
