import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { createDefaultManifest, saveManifest } from '../../manifest';

export function makeInitCommand(): Command {
  const cmd = new Command('init');

  cmd
    .description('Initialize a new stacksnap manifest file')
    .option('-o, --output <path>', 'Output path for the manifest file', 'stacksnap.yml')
    .option('-f, --force', 'Overwrite existing manifest if present', false)
    .action(async (options) => {
      const outputPath = path.resolve(process.cwd(), options.output);

      if (fs.existsSync(outputPath) && !options.force) {
        console.error(
          `Manifest already exists at ${outputPath}. Use --force to overwrite.`
        );
        process.exit(1);
      }

      try {
        const manifest = createDefaultManifest();
        await saveManifest(manifest, outputPath);
        console.log(`✔ Initialized stacksnap manifest at ${outputPath}`);
        console.log('');
        console.log('Next steps:');
        console.log('  stacksnap capture   — capture your current environment');
        console.log('  stacksnap restore   — restore environment from manifest');
        console.log('  stacksnap diff      — compare manifest with current state');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Failed to initialize manifest: ${message}`);
        process.exit(1);
      }
    });

  return cmd;
}
