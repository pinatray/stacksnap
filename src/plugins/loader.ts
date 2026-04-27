import { registry } from './registry';
import { Plugin, PluginSnapshot } from './types';

export async function captureAll(): Promise<PluginSnapshot[]> {
  const plugins = registry.list();
  if (plugins.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    plugins.map((plugin) => plugin.capture())
  );

  const snapshots: PluginSnapshot[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const plugin = plugins[i];
    if (result.status === 'fulfilled') {
      snapshots.push(result.value);
    } else {
      console.warn(`Plugin "${plugin.name}" capture failed: ${result.reason}`);
    }
  }

  return snapshots;
}

export async function restoreAll(snapshots: PluginSnapshot[]): Promise<void> {
  for (const snapshot of snapshots) {
    const plugin = registry.get(snapshot.plugin);
    if (!plugin) {
      console.warn(`No plugin found for "${snapshot.plugin}", skipping`);
      continue;
    }
    if (plugin.validate && !plugin.validate(snapshot)) {
      console.warn(`Snapshot validation failed for "${snapshot.plugin}", skipping`);
      continue;
    }
    try {
      await plugin.restore(snapshot);
    } catch (err) {
      console.error(`Plugin "${snapshot.plugin}" restore failed: ${err}`);
    }
  }
}

export function loadPlugin(plugin: Plugin): void {
  registry.register(plugin);
}
