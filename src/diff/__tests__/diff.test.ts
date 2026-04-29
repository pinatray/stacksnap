import { diffManifests, formatDiffResults } from '../diff';
import { StackSnapManifest } from '../../manifest/types';

function makeManifest(plugins: Record<string, string[]>): StackSnapManifest {
  return {
    version: '1.0.0',
    name: 'test',
    plugins,
  };
}

describe('diffManifests', () => {
  it('returns no changes when manifests are identical', () => {
    const manifest = makeManifest({ brew: ['git', 'curl'] });
    const result = diffManifests(manifest, manifest);
    expect(result.hasChanges).toBe(false);
    expect(result.pluginDiffs).toHaveLength(0);
  });

  it('detects added items', () => {
    const current = makeManifest({ brew: ['git'] });
    const incoming = makeManifest({ brew: ['git', 'curl'] });
    const result = diffManifests(current, incoming);
    expect(result.hasChanges).toBe(true);
    expect(result.pluginDiffs[0].added).toContain('curl');
    expect(result.pluginDiffs[0].removed).toHaveLength(0);
  });

  it('detects removed items', () => {
    const current = makeManifest({ brew: ['git', 'curl'] });
    const incoming = makeManifest({ brew: ['git'] });
    const result = diffManifests(current, incoming);
    expect(result.hasChanges).toBe(true);
    expect(result.pluginDiffs[0].removed).toContain('curl');
    expect(result.pluginDiffs[0].added).toHaveLength(0);
  });

  it('detects new plugins in incoming', () => {
    const current = makeManifest({ brew: ['git'] });
    const incoming = makeManifest({ brew: ['git'], npm: ['typescript'] });
    const result = diffManifests(current, incoming);
    expect(result.hasChanges).toBe(true);
    const npmDiff = result.pluginDiffs.find((d) => d.plugin === 'npm');
    expect(npmDiff).toBeDefined();
    expect(npmDiff?.added).toContain('typescript');
  });

  it('detects plugins removed in incoming', () => {
    const current = makeManifest({ brew: ['git'], npm: ['typescript'] });
    const incoming = makeManifest({ brew: ['git'] });
    const result = diffManifests(current, incoming);
    expect(result.hasChanges).toBe(true);
    const npmDiff = result.pluginDiffs.find((d) => d.plugin === 'npm');
    expect(npmDiff?.removed).toContain('typescript');
  });

  it('tracks unchanged items correctly', () => {
    const current = makeManifest({ brew: ['git', 'curl'] });
    const incoming = makeManifest({ brew: ['git', 'wget'] });
    const result = diffManifests(current, incoming);
    expect(result.pluginDiffs[0].unchanged).toContain('git');
  });
});

describe('formatDiffResults', () => {
  it('returns no-change message when no differences', () => {
    const result = { hasChanges: false, pluginDiffs: [] };
    expect(formatDiffResults(result)).toMatch(/no differences/i);
  });

  it('formats added and removed items with +/- prefix', () => {
    const result = {
      hasChanges: true,
      pluginDiffs: [
        { plugin: 'brew', added: ['wget'], removed: ['curl'], unchanged: ['git'] },
      ],
    };
    const output = formatDiffResults(result);
    expect(output).toContain('+ wget');
    expect(output).toContain('- curl');
    expect(output).toContain('[brew]');
  });
});
