// Converts the PNG hero sequence to WebP for a far smaller payload.
// Originals stay in assets/sequence/; output lands in public/assets/sequence/.
import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = "assets/sequence";
const OUT = "public/assets/sequence";
const QUALITY = 78;               // visually lossless for this content at 1080p
const CONCURRENCY = 8;

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => f.endsWith(".png")).sort();
let done = 0, srcBytes = 0, outBytes = 0;

async function convert(file) {
  const inPath = path.join(SRC, file);
  const outPath = path.join(OUT, file.replace(/\.png$/, ".webp"));
  srcBytes += (await stat(inPath)).size;
  if (!existsSync(outPath)) {
    await sharp(inPath).webp({ quality: QUALITY, effort: 4 }).toFile(outPath);
  }
  outBytes += (await stat(outPath)).size;
  done++;
  if (done % 30 === 0 || done === files.length) {
    process.stdout.write(`  ${done}/${files.length}\n`);
  }
}

// Simple concurrency pool.
let i = 0;
async function worker() {
  while (i < files.length) await convert(files[i++]);
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const mb = (b) => (b / 1048576).toFixed(1) + "MB";
console.log(`DONE ${files.length} frames  ${mb(srcBytes)} -> ${mb(outBytes)}`);
