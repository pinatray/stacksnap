export interface Plugin {
  name: string;
  description: string;
  capture: () => Promise<PluginSnapshot>;
  restore: (snapshot: PluginSnapshot) => Promise<void>;
  validate?: (snapshot: PluginSnapshot) => boolean;
}

export interface PluginSnapshot {
  plugin: string;
  version: string;
  capturedAt: string;
  data: Record<string, unknown>;
}

export interface PluginRegistry {
  register: (plugin: Plugin) => void;
  get: (name: string) => Plugin | undefined;
  list: () => Plugin[];
  has: (name: string) => boolean;
}

export type PluginMap = Map<string, Plugin>;
