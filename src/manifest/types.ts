export interface ToolEntry {
  name: string;
  version?: string;
  source?: string;
}

export interface EnvVar {
  key: string;
  value: string;
}

export interface ShellConfig {
  shell: string;
  rcFile?: string;
  plugins?: string[];
}

export interface StackSnapManifest {
  version: string;
  name: string;
  description?: string;
  tools: ToolEntry[];
  env?: EnvVar[];
  shell?: ShellConfig;
  extensions?: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
}
