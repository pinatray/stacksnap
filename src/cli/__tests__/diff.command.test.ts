import { Command } from 'commander';
import { makeDiffCommand } from '../commands/diff';
import * as manifestModule from '../../manifest';
import * as diffModule from '../../diff';
import type { Manifest } from '../../manifest/types';
import type { DiffResult } from '../../diff/types';

jest.mock('../../manifest');
jest.mock('../../diff');

const mockLoadManifest = manifestModule.loadManifest as jest.MockedFunction<typeof manifestModule.loadManifest>;
const mockDiffManifests = diffModule.diffManifests as jest.MockedFunction<typeof diffModule.diffManifests>;
const mockFormatDiffResults = diffModule.formatDiffResults as jest.MockedFunction<typeof diffModule.formatDiffResults>;

function makeManifest(overrides: Partial<Manifest> = {}): Manifest {
  return {
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plugins: {},
    ...overrides,
  };
}

async function runCmd(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(makeDiffCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'stacksnap', 'diff', ...args]);
}

describe('diff command', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    process.exitCode = undefined;
  });

  it('prints no differences message when manifests are identical', async () => {
    const m = makeManifest();
    mockLoadManifest.mockResolvedValue(m);
    mockDiffManifests.mockReturnValue([]);

    await runCmd(['a.yaml', 'b.yaml']);

    expect(consoleLogSpy).toHaveBeenCalledWith('No differences found.');
    expect(process.exitCode).toBeUndefined();
  });

  it('prints formatted diff and sets exit code 1 when differences exist', async () => {
    const m = makeManifest();
    mockLoadManifest.mockResolvedValue(m);
    const results: DiffResult[] = [{ plugin: 'brew', added: ['wget'], removed: [] }];
    mockDiffManifests.mockReturnValue(results);
    mockFormatDiffResults.mockReturnValue('+ brew: wget');

    await runCmd(['a.yaml', 'b.yaml']);

    expect(mockFormatDiffResults).toHaveBeenCalledWith(results);
    expect(consoleLogSpy).toHaveBeenCalledWith('+ brew: wget');
    expect(process.exitCode).toBe(1);
  });

  it('filters results by --plugin option', async () => {
    const m = makeManifest();
    mockLoadManifest.mockResolvedValue(m);
    const results: DiffResult[] = [
      { plugin: 'brew', added: ['wget'], removed: [] },
      { plugin: 'npm', added: ['typescript'], removed: [] },
    ];
    mockDiffManifests.mockReturnValue(results);
    mockFormatDiffResults.mockReturnValue('+ npm: typescript');

    await runCmd(['a.yaml', 'b.yaml', '--plugin', 'npm']);

    expect(mockFormatDiffResults).toHaveBeenCalledWith([results[1]]);
  });

  it('logs error and sets exit code 2 on failure', async () => {
    mockLoadManifest.mockRejectedValue(new Error('file not found'));

    await runCmd(['missing.yaml', 'b.yaml']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: file not found');
    expect(process.exitCode).toBe(2);
  });
});
