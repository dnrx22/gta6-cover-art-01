// Neon Vice Cover Studio — build entry point.
//
// Copies app/ and screenshots/ into the output directory and writes
// dossier.json there, built from vendor/makefun-app.ts.
//
// Node 22, standard library only. Run it with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory is treated as a possibly-mounted volume: this program
// never deletes the directory itself, it only clears its contents.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
};

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));

function outputDir(): string {
  const chosen = process.env.MAKEFUN_OUTPUT_DIR ?? process.argv[2] ?? 'out';
  return resolve(process.cwd(), chosen);
}

/**
 * Remove every child entry of `dir`, but never `dir` itself.
 * The grader may run with the output directory as a mounted volume,
 * and removing a mount point fails, so only the contents are cleared.
 */
function clearContents(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir).sort()) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

interface TreeStats {
  files: number;
  bytes: number;
}

function countFiles(dir: string): TreeStats {
  let files = 0;
  let bytes = 0;
  const walk = (current: string): void => {
    const entries = readdirSync(current, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        files += 1;
        bytes += statSync(full).size;
      }
    }
  };
  walk(dir);
  return { files, bytes };
}

function main(): void {
  const out = outputDir();
  const appDir = join(REPO_ROOT, 'app');
  const shotsDir = join(REPO_ROOT, 'screenshots');
  if (!existsSync(appDir)) {
    throw new Error(`app/ directory not found at ${appDir}`);
  }
  if (!existsSync(shotsDir)) {
    throw new Error(`screenshots/ directory not found at ${shotsDir}`);
  }
  mkdirSync(out, { recursive: true });
  clearContents(out);
  cpSync(appDir, join(out, 'app'), { recursive: true });
  cpSync(shotsDir, join(out, 'screenshots'), {
    recursive: true,
  });
  const dossier = buildDossier(out, CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);
  const appStats = countFiles(join(out, 'app'));
  const shotStats = countFiles(join(out, 'screenshots'));
  console.log(`output: ${out}`);
  console.log(`app: ${appStats.files} files, ${appStats.bytes} bytes`);
  console.log(`screenshots: ${shotStats.files} files, ${shotStats.bytes} bytes`);
  console.log(`dossier.json: ${dossier.length} bytes`);
  console.log('build ok');
}

main();
