// Builds the "work strip": the three project screenshots cropped to 5:7
// portraits and laid side by side in one image.
//
// One file, two consumers — that is the point of it:
//   • the WebGL ring samples it as the texture on its panels, and
//   • the DOM cards paint it as their front face (background-size 300%).
// Because both read the same pixels, the moment the unrolled ring hands off
// to the real cards there is nothing to reconcile: it is the same picture.
//
// Run: node scripts/build-work-strip.mjs
import sharp from "sharp";

const OUT = "src/assets/images/work-strip.webp";
const PANEL_W = 560;                       // 5:7 → 560 × 784
const PANEL_H = 784;

// Where each 5:7 window sits inside its 1440×900 screenshot. Chosen by eye so
// every panel keeps its site's headline — the thing that makes it readable
// at a glance as it swings past.
const panels = [
  { src: "src/assets/images/blockshield.jpg", left: 0 },
  { src: "src/assets/images/o2fitness.jpg",   left: 250 },
  { src: "src/assets/images/powerlifter.jpg", left: 80 },
];

const CROP_H = 900;
const CROP_W = Math.round((CROP_H * 5) / 7);   // 643

const tiles = await Promise.all(
  panels.map(({ src, left }) =>
    sharp(src)
      .extract({ left, top: 0, width: CROP_W, height: CROP_H })
      .resize(PANEL_W, PANEL_H)
      .toBuffer()
  )
);

await sharp({
  create: { width: PANEL_W * panels.length, height: PANEL_H, channels: 3, background: "#000" },
})
  .composite(tiles.map((input, i) => ({ input, left: i * PANEL_W, top: 0 })))
  .webp({ quality: 84, effort: 5 })
  .toFile(OUT);

console.log(`wrote ${OUT} (${PANEL_W * panels.length}×${PANEL_H})`);
