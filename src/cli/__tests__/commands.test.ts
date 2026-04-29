import { makeCaptureCommand } from '../commands/capture';
import { makeRestoreCommand } from '../commands/restore';
import * as manifestModule from '../../manifest';
import * as builtinModule from '../../plugins/builtin';
import { PluginRegistryImpl } from '../../plugins';

jest.mock('../../manifest');
jest.mock('../../plugins/builtin');

const mockManifest = { version: '1.0', plugins: {} };

const mockPlugin = {
  name: 'brew',
  capture: jest.fn().mockResolvedValue({ plugin: 'brew', status: 'success', message: 'captured' }),
  restore: jest.fn().mockResolvedValue({ plugin: 'brew', status: 'success', message: 'restored' }),
};

beforeEach(() => {
  jest.clearAllMocks();
  (manifestModule.loadManifest as jest.Mock).mockResolvedValue(mockManifest);
  (manifestModule.saveManifest as jest.Mock).mockResolvedValue(undefined);
  (manifestModule.createDefaultManifest as jest.Mock).mockReturnValue(mockManifest);
  (builtinModule.registerBuiltinPlugins as jest.Mock).mockImplementation((registry: PluginRegistryImpl) => {
    registry.register(mockPlugin);
  });
});

describe('capture command', () => {
  it('creates a capture command with correct name', () => {
    const cmd = makeCaptureCommand();
    expect(cmd.name()).toBe('capture');
  });

  it('has --output option defaulting to stacksnap.yaml', () => {
    const cmd = makeCaptureCommand();
    const outputOpt = cmd.options.find((o) => o.long === '--output');
    expect(outputOpt).toBeDefined();
    expect(outputOpt?.defaultValue).toBe('stacksnap.yaml');
  });

  it('has --plugins option', () => {
    const cmd = makeCaptureCommand();
    const pluginsOpt = cmd.options.find((o) => o.long === '--plugins');
    expect(pluginsOpt).toBeDefined();
  });
});

describe('restore command', () => {
  it('creates a restore command with correct name', () => {
    const cmd = makeRestoreCommand();
    expect(cmd.name()).toBe('restore');
  });

  it('has --dry-run flag defaulting to false', () => {
    const cmd = makeRestoreCommand();
    const dryRunOpt = cmd.options.find((o) => o.long === '--dry-run');
    expect(dryRunOpt).toBeDefined();
    expect(dryRunOpt?.defaultValue).toBe(false);
  });

  it('has --input option defaulting to stacksnap.yaml', () => {
    const cmd = makeRestoreCommand();
    const inputOpt = cmd.options.find((o) => o.long === '--input');
    expect(inputOpt).toBeDefined();
    expect(inputOpt?.defaultValue).toBe('stacksnap.yaml');
  });

  it('has --plugins option', () => {
    const cmd = makeRestoreCommand();
    const pluginsOpt = cmd.options.find((o) => o.long === '--plugins');
    expect(pluginsOpt).toBeDefined();
  });
});
