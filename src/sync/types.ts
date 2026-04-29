export interface SyncContext {
  dryRun: boolean;
  verbose?: boolean;
}

export interface PluginSyncable {
  capture(manifest: unknown, ctx: SyncContext): Promise<void>;
  restore(manifest: unknown, ctx: SyncContext): Promise<void>;
}
