import { Plugin, PluginMap, PluginRegistry } from './types';

class PluginRegistryImpl implements PluginRegistry {
  private plugins: PluginMap = new Map();

  register(plugin: Plugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a valid name');
    }
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }
    if (typeof plugin.capture !== 'function') {
      throw new Error(`Plugin "${plugin.name}" must implement capture()`);
    }
    if (typeof plugin.restore !== 'function') {
      throw new Error(`Plugin "${plugin.name}" must implement restore()`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  unregister(name: string): boolean {
    return this.plugins.delete(name);
  }

  clear(): void {
    this.plugins.clear();
  }
}

export const registry = new PluginRegistryImpl();
export { PluginRegistryImpl };
