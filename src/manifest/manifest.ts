import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { StackSnapManifest } from './types';

const DEFAULT_MANIFEST_FILENAME = 'stacksnap.yaml';

export function loadManifest(filePath?: string): StackSnapManifest {
  const resolvedPath = filePath
    ? path.resolve(filePath)
    : path.resolve(process.cwd(), DEFAULT_MANIFEST_FILENAME);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Manifest not found at: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const parsed = yaml.load(raw) as StackSnapManifest;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid manifest: could not parse YAML');
  }

  validateManifest(parsed);
  return parsed;
}

export function saveManifest(manifest: StackSnapManifest, filePath?: string): void {
  const resolvedPath = filePath
    ? path.resolve(filePath)
    : path.resolve(process.cwd(), DEFAULT_MANIFEST_FILENAME);

  manifest.updatedAt = new Date().toISOString();
  const yamlContent = yaml.dump(manifest, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(resolvedPath, yamlContent, 'utf8');
}

export function createDefaultManifest(name: string): StackSnapManifest {
  return {
    version: '1.0',
    name,
    description: '',
    tools: [],
    env: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function validateManifest(manifest: StackSnapManifest): void {
  if (!manifest.version) throw new Error('Manifest must have a version field');
  if (!manifest.name) throw new Error('Manifest must have a name field');
  if (!Array.isArray(manifest.tools)) throw new Error('Manifest tools must be an array');
}
