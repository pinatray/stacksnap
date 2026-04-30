import { Command } from 'commander';
import * as path from 'path';
import { loadManifest } from '../../manifest';
import { diffManifests, formatDiffResults } from '../../diff';

export function makeDiffCommand(): Command {
  const cmd = new Command('diff');

  cmd
    .description('Compare two stacksnap manifest files and show differences')
    .argument('<manifest-a>', 'Path to the first (base) manifest file')
    .argument('<manifest-b>', 'Path to the second (target) manifest file')
    .option('--no-color', 'Disable colored output')
    .option('--plugin <name>', 'Only diff a specific plugin section')
    .action(async (manifestAPath: string, manifestBPath: string, options: { color: boolean; plugin?: string }) => {
      try {
        const resolvedA = path.resolve(process.cwd(), manifestAPath);
        const resolvedB = path.resolve(process.cwd(), manifestBPath);

        const manifestA = await loadManifest(resolvedA);
        const manifestB = await loadManifest(resolvedB);

        const results = diffManifests(manifestA, manifestB);

        const filtered = options.plugin
          ? results.filter((r) => r.plugin === options.plugin)
          : results;

        if (filtered.length === 0) {
          console.log('No differences found.');
          return;
        }

        const output = formatDiffResults(filtered);
        console.log(output);

        const hasChanges = filtered.some(
          (r) => r.added.length > 0 || r.removed.length > 0
        );
        process.exitCode = hasChanges ? 1 : 0;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exitCode = 2;
      }
    });

  return cmd;
}
