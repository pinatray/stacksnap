import { Command } from 'commander';
import * as path from 'path';
import { loadManifest, saveManifest, createDefaultManifest } from '../../manifest';
import { PluginRegistryImpl } from '../../plugins';
import { registerBuiltinPlugins } from '../../plugins/builtin';
import { SyncResult } from '../../sync/types';
import { formatSyncResults } from '../../sync';

export function makeCaptureCommand(): Command {
  const cmd = new Command('capture');

  cmd
    .description('Capture current dev environment into a manifest file')
    .option('-o, --output <file>', 'Output manifest file path', 'stacksnap.yaml')
    .option('--plugins <plugins>', 'Comma-separated list of plugins to run (default: all)')
    .action(async (options) => {
      const outputPath = path.resolve(process.cwd(), options.output);

      let manifest = createDefaultManifest();
      try {
        manifest = await loadManifest(outputPath);
        console.log(`Loaded existing manifest: ${outputPath}`);
      } catch {
        console.log('No existing manifest found, creating new one.');
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

        const ctx = { manifest, dryRun: false };
        try {
          const result = await plugin.capture(ctx);
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
      if (!hasError) {
        await saveManifest(outputPath, manifest);
        console.log(`\nManifest saved to ${outputPath}`);
      } else {
        console.error('\nCapture completed with errors. Manifest not saved.');
        process.exitCode = 1;
      }
    });

  return cmd;
}
