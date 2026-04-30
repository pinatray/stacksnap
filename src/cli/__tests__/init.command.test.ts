import { makeInitCommand } from '../commands/init';
import * as manifestModule from '../../manifest';
import * as fs from 'fs';

jest.mock('../../manifest');
jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedManifest = manifestModule as jest.Mocked<typeof manifestModule>;

describe('makeInitCommand', () => {
  const defaultManifest = { version: '1.0', plugins: {} };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedManifest.createDefaultManifest.mockReturnValue(defaultManifest as any);
    mockedManifest.saveManifest.mockResolvedValue(undefined);
    mockedFs.existsSync.mockReturnValue(false);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a default manifest and saves it', async () => {
    const cmd = makeInitCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(mockedManifest.createDefaultManifest).toHaveBeenCalledTimes(1);
    expect(mockedManifest.saveManifest).toHaveBeenCalledWith(
      defaultManifest,
      expect.stringContaining('stacksnap.yml')
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Initialized stacksnap manifest')
    );
  });

  it('exits with error if manifest exists and --force not set', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    const cmd = makeInitCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(mockedManifest.saveManifest).not.toHaveBeenCalled();
  });

  it('overwrites existing manifest when --force is set', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    const cmd = makeInitCommand();
    await cmd.parseAsync(['node', 'test', '--force']);

    expect(mockedManifest.saveManifest).toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('uses custom output path when --output is provided', async () => {
    const cmd = makeInitCommand();
    await cmd.parseAsync(['node', 'test', '--output', 'custom/env.yml']);

    expect(mockedManifest.saveManifest).toHaveBeenCalledWith(
      defaultManifest,
      expect.stringContaining('custom/env.yml')
    );
  });

  it('exits with error if saveManifest throws', async () => {
    mockedManifest.saveManifest.mockRejectedValue(new Error('disk full'));
    const cmd = makeInitCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('disk full')
    );
  });
});
