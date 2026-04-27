import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadManifest, saveManifest, createDefaultManifest } from '../manifest';
import { StackSnapManifest } from '../types';

describe('manifest module', () => {
  let tmpDir: string;
  let manifestPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-'));
    manifestPath = path.join(tmpDir, 'stacksnap.yaml');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('createDefaultManifest', () => {
    it('creates a manifest with required fields', () => {
      const manifest = createDefaultManifest('my-env');
      expect(manifest.name).toBe('my-env');
      expect(manifest.version).toBe('1.0');
      expect(manifest.tools).toEqual([]);
      expect(manifest.createdAt).toBeDefined();
    });
  });

  describe('saveManifest and loadManifest', () => {
    it('saves and loads a manifest correctly', () => {
      const original = createDefaultManifest('test-project');
      original.tools = [{ name: 'node', version: '20.0.0' }];

      saveManifest(original, manifestPath);
      expect(fs.existsSync(manifestPath)).toBe(true);

      const loaded = loadManifest(manifestPath);
      expect(loaded.name).toBe('test-project');
      expect(loaded.tools).toHaveLength(1);
      expect(loaded.tools[0].name).toBe('node');
    });

    it('updates updatedAt on save', () => {
      const manifest = createDefaultManifest('ts-env');
      const before = new Date().toISOString();
      saveManifest(manifest, manifestPath);
      const loaded = loadManifest(manifestPath);
      expect(loaded.updatedAt! >= before).toBe(true);
    });
  });

  describe('loadManifest error handling', () => {
    it('throws if file does not exist', () => {
      expect(() => loadManifest('/nonexistent/path.yaml')).toThrow('Manifest not found');
    });

    it('throws if manifest is missing required fields', () => {
      fs.writeFileSync(manifestPath, 'description: oops\n', 'utf8');
      expect(() => loadManifest(manifestPath)).toThrow();
    });
  });
});
