import { useCallback, useEffect, useMemo, useRef } from "react";

const FRAME_COUNT = 150;
const CONCURRENCY = 6;

// Interlaced passes. Each walks the WHOLE timeline at a finer step, so after
// the first one every scroll position already has a frame within 4 of it.
const PASSES = {
  full:  [8, 4, 2, 1],   // desktop: all 150 frames, ~7.5 MB
  light: [8, 4, 2],      // phones and coarse pointers: 75
  saver: [8, 4],         // Save-Data on, or a 2G/3G connection: 38
};

function passesForThisDevice() {
  const net = navigator.connection;
  if (net && (net.saveData || /2g|3g/.test(net.effectiveType || ""))) return PASSES.saver;
  const light =
    window.matchMedia("(max-width: 860px)").matches ||
    window.matchMedia("(pointer: coarse)").matches;
  return light ? PASSES.light : PASSES.full;
}

const pad = (n) => String(n).padStart(4, "0");
const framePath = (i) =>
  `${import.meta.env.BASE_URL}assets/sequence/male${pad(i + 1)}.webp`;

/**
 * Loads a WebP image sequence and renders one frame to a <canvas>.
 * Knows nothing about scroll — the caller drives it with setFrame().
 *
 * Loadability:
 *  • 150 frames at ~51 KB (scripts/convert-frames.mjs).
 *  • The page waits for ONE frame: the opening pose, which index.html
 *    already preloads. Everything else streams in behind the visitor.
 *  • Loading is INTERLACED, not sequential: each pass spans the whole
 *    timeline at a finer step, so the hero is scrubbable end to end early and
 *    only gets smoother. Gaps fall back to the nearest loaded frame — an
 *    unrefined stretch is a lower frame rate, never a hole.
 *  • Phones stop at every 2nd frame; Save-Data and slow connections at
 *    every 4th.
 *  • Requests are capped at CONCURRENCY in flight.
 *  • Draws are dirty-flagged onto requestAnimationFrame, so many
 *    setFrame() calls in one frame collapse into a single drawImage.
 */
export function useImageSequence(canvasRef) {
  const images = useRef(new Array(FRAME_COUNT));
  const current = useRef(0);
  const lastDrawn = useRef(-1);
  const rafId = useRef(null);

  // Nearest loaded frame, so a not-yet-downloaded index degrades to a lower
  // frame rate instead of flashing an empty canvas.
  const nearest = useCallback((index) => {
    const list = images.current;
    if (list[index]) return list[index];
    for (let d = 1; d < FRAME_COUNT; d++) {
      if (list[index - d]) return list[index - d];
      if (list[index + d]) return list[index + d];
    }
    return null;
  }, []);

  // Cover-fit one frame into any canvas. Shared by the hero and by paint(),
  // which lets another section (the Contact bookend) reuse the decoded
  // frames without downloading a thing.
  //
  // Where cover-fit has to crop vertically (screens wider than the frames'
  // 16:9) the crop is taken mostly from the BOTTOM: the character's hair
  // stays in shot and the jacket gives way instead.
  const ANCHOR_Y = 0.15;

  const drawInto = useCallback((canvas, index) => {
    const img = nearest(index);
    if (!canvas || !img) return false;
    const ctx = canvas.getContext("2d");
    const cw = canvas.width, ch = canvas.height;
    const ratio = Math.max(cw / img.width, ch / img.height);
    const dw = img.width * ratio, dh = img.height * ratio;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) * ANCHOR_Y, dw, dh);
    return true;
  }, [nearest]);

  const draw = useCallback(() => {
    rafId.current = null;
    if (drawInto(canvasRef.current, current.current)) lastDrawn.current = current.current;
  }, [canvasRef, drawInto]);

  const markDirty = useCallback(() => {
    if (rafId.current === null) rafId.current = requestAnimationFrame(draw);
  }, [draw]);

  const setFrame = useCallback((index) => {
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));
    if (clamped === current.current && lastDrawn.current === clamped) return;
    current.current = clamped;
    markDirty();
  }, [markDirty]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    lastDrawn.current = -1;
    markDirty();
  }, [canvasRef, markDirty]);

  const loadFrame = useCallback((index) => new Promise((resolve) => {
    if (images.current[index]) return resolve();
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      images.current[index] = img;
      if (lastDrawn.current === -1) markDirty(); // first frame in → show it
      resolve();
    };
    img.onerror = () => resolve();               // a gap must not stall the pool
    img.src = framePath(index);
  }), [markDirty]);

  /**
   * Start loading. Returns a promise that settles when the OPENING frame is
   * in and decoded — the only frame the first screen shows, and so the only
   * one the page waits for. The passes after it are not awaited: they run
   * in the background and quietly raise the frame rate.
   */
  const preload = useCallback(() => {
    // Each index is claimed once, so a later pass only fetches what the
    // coarser passes did not already cover.
    const claimed = new Set([0]);
    const passIndices = (step) => {
      const out = [];
      for (let i = 0; i < FRAME_COUNT; i += step) {
        if (!claimed.has(i)) { claimed.add(i); out.push(i); }
      }
      return out;
    };

    const runPool = (list) => {
      let next = 0;
      const worker = async () => {
        while (next < list.length) await loadFrame(list[next++]);
      };
      return Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker)
      );
    };

    // Decoded up front, so the first drawImage never stalls the hand-over.
    const gate = loadFrame(0).then(() => images.current[0]?.decode?.().catch(() => {}));

    // Passes run one after another, so the coarse fill always completes
    // before the network is spent on finer detail.
    gate.then(async () => {
      for (const step of passesForThisDevice()) await runPool(passIndices(step));
    });

    return gate;
  }, [loadFrame]);

  // Size the canvas up front and keep it sized (debounced).
  useEffect(() => {
    resize();
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(resize, 150); };
    window.addEventListener("resize", onResize, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, [resize]);

  // paint(canvas, index): draw a frame of the sequence into some OTHER canvas.
  // Synchronous — callers batch it onto their own animation frame.
  const paint = useCallback((canvas, index) => {
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));
    return drawInto(canvas, clamped);
  }, [drawInto]);

  // Stable handle so effects that depend on `sequence` don't re-run each render.
  return useMemo(
    () => ({ setFrame, paint, preload, frameCount: FRAME_COUNT }),
    [setFrame, paint, preload]
  );
}
