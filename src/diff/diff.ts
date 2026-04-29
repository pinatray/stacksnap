import { StackSnapManifest } from '../manifest/types';
import { DiffResult, PluginDiff } from './types';

export function diffManifests(
  current: StackSnapManifest,
  incoming: StackSnapManifest
): DiffResult {
  const pluginDiffs: PluginDiff[] = [];

  const allPlugins = new Set([
    ...Object.keys(current.plugins),
    ...Object.keys(incoming.plugins),
  ]);

  for (const pluginName of allPlugins) {
    const currentItems: string[] = current.plugins[pluginName] ?? [];
    const incomingItems: string[] = incoming.plugins[pluginName] ?? [];

    const added = incomingItems.filter((item) => !currentItems.includes(item));
    const removed = currentItems.filter((item) => !incomingItems.includes(item));
    const unchanged = currentItems.filter((item) => incomingItems.includes(item));

    if (added.length > 0 || removed.length > 0) {
      pluginDiffs.push({ plugin: pluginName, added, removed, unchanged });
    }
  }

  const hasChanges = pluginDiffs.length > 0;

  return { hasChanges, pluginDiffs };
}

export function formatDiffResults(diff: DiffResult): string {
  if (!diff.hasChanges) {
    return 'No differences found between manifests.';
  }

  const lines: string[] = ['Differences detected:\n'];

  for (const pluginDiff of diff.pluginDiffs) {
    lines.push(`  [${pluginDiff.plugin}]`);
    for (const item of pluginDiff.added) {
      lines.push(`    + ${item}`);
    }
    for (const item of pluginDiff.removed) {
      lines.push(`    - ${item}`);
    }
  }

  return lines.join('\n');
}
