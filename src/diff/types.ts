export interface PluginDiff {
  plugin: string;
  added: string[];
  removed: string[];
  unchanged: string[];
}

export interface DiffResult {
  hasChanges: boolean;
  pluginDiffs: PluginDiff[];
}
