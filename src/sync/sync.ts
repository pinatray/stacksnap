import { Manifest } from '../manifest/types';
import { PluginRegistry } from '../plugins/types';

export type SyncDirection = 'capture' | 'restore';

export interface SyncResult {
  plugin: string;
  direction: SyncDirection;
  success: boolean;
  error?: string;
}

export interface SyncOptions {
  direction: SyncDirection;
  plugins?: string[];
  dryRun?: boolean;
}

export async function syncManifest(
  manifest: Manifest,
  registry: PluginRegistry,
  options: SyncOptions
): Promise<SyncResult[]> {
  const { direction, plugins: filterPlugins, dryRun = false } = options;
  const results: SyncResult[] = [];

  const allPlugins = registry.list();
  const targetPlugins = filterPlugins
    ? allPlugins.filter((p) => filterPlugins.includes(p.name))
    : allPlugins;

  for (const plugin of targetPlugins) {
    try {
      if (dryRun) {
        results.push({ plugin: plugin.name, direction, success: true });
        continue;
      }

      if (direction === 'capture') {
        await plugin.capture(manifest, { dryRun });
      } else {
        await plugin.restore(manifest, { dryRun });
      }

      results.push({ plugin: plugin.name, direction, success: true });
    } catch (err) {
      results.push({
        plugin: plugin.name,
        direction,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

export function formatSyncResults(results: SyncResult[]): string {
  const lines = results.map((r) => {
    const status = r.success ? '✓' : '✗';
    const detail = r.error ? ` — ${r.error}` : '';
    return `  ${status} ${r.plugin}${detail}`;
  });
  const passed = results.filter((r) => r.success).length;
  lines.push(`\n${passed}/${results.length} plugins succeeded.`);
  return lines.join('\n');
}
