// Builds the hero's image sequence: PNG renders in, web-ready WebP frames out.
//
//   node scripts/convert-frames.mjs <folder-of-png-frames>
//
// The originals (300 transparent 1920×1080 PNGs, ~70 MB) are not kept in the
// repo; they live in its git history under assets/sequence/. Every second
// render is kept — 150 frames is one per ~2vh of scroll, which scrubs
// smoothly — and renumbered 0001…0150 into public/assets/sequence/.
//
// Encoder settings were chosen by comparing 100% crops of the hair against
// the PNGs: quality 72 with smart subsampling and a lighter alpha plane is
// indistinguishable at that zoom and ~30% smaller than quality 78.
import sharp from "sharp";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2];
const OUT = "public/assets/sequence";
const KEEP_EVERY = 2;
const WEBP = { quality: 72, effort: 6, alphaQuality: 70, smartSubsample: true };
const CONCURRENCY = 6;

if (!SRC) {
  console.error("usage: node scripts/convert-frames.mjs <folder-of-png-frames>");
  process.exit(1);
}

const pngs = (await readdir(SRC)).filter((f) => f.endsWith(".png")).sort();
const picked = pngs.filter((_, i) => i % KEEP_EVERY === 0);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

let next = 0, bytes = 0;
const pad = (n) => String(n).padStart(4, "0");
async function worker() {
  while (next < picked.length) {
    const i = next++;
    const out = path.join(OUT, `male${pad(i + 1)}.webp`);
    await sharp(path.join(SRC, picked[i])).webp(WEBP).toFile(out);
    // Await first, then add: `bytes += await …` reads `bytes` before the
    // await, so parallel workers would overwrite each other's totals.
    const { size } = await stat(out);
    bytes += size;
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`${picked.length} frames → ${OUT} (${(bytes / 1048576).toFixed(1)} MB)`);
