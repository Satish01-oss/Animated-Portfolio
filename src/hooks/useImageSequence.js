import { useCallback, useEffect, useMemo, useRef } from "react";

const FRAME_COUNT = 300;
const CONCURRENCY = 8;

// Interlaced passes. Each pass walks the WHOLE timeline at a finer step, so
// after pass 1 every scroll position already has a frame within 4 of it.
// The loader waits for pass 1 only; the rest fill in behind the visitor.
const PASSES_FULL = [12, 6, 3, 1];   // ends at all 300 frames
const PASSES_LIGHT = [12, 6, 3];     // coarse pointers stop at 100

const pad = (n) => String(n).padStart(4, "0");
const framePath = (i) =>
  `${import.meta.env.BASE_URL}assets/sequence/male${pad(i + 1)}.webp`;

/**
 * Loads a WebP image sequence and renders one frame to a <canvas>.
 * Knows nothing about scroll — the caller drives it with setFrame().
 *
 * Loadability:
 *  • WebP frames (~70% smaller than the PNG originals).
 *  • Loading is INTERLACED, not sequential. Pass 1 fetches every 12th frame —
 *    25 images, under 2 MB — and that alone spans the entire sequence, so the
 *    hero is scrubbable end to end the moment the loader lifts. Later passes
 *    (6th, 3rd, every) refine it in the background while the visitor is still
 *    reading the first screen.
 *
 *    The alternative, waiting for all 300, means holding a black screen for
 *    ~21 MB before anything can be seen — fine on localhost, close to twenty
 *    seconds on a real connection.
 *
 *    Gaps are covered by draw()'s nearest-loaded-frame fallback, so an
 *    unrefined stretch degrades to a lower frame rate rather than a hole.
 *  • Coarse-pointer / narrow devices stop at every 2nd frame, roughly
 *    halving the eventual payload.
 *  • Requests are capped at CONCURRENCY in flight.
 *  • Draws are dirty-flagged onto requestAnimationFrame, so many
 *    setFrame() calls in one frame collapse into a single drawImage.
 */
export function useImageSequence(canvasRef) {
  const images = useRef(new Array(FRAME_COUNT));
  const current = useRef(0);
  const lastDrawn = useRef(-1);
  const rafId = useRef(null);

  const draw = useCallback(() => {
    rafId.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Nearest loaded frame, so a not-yet-downloaded index degrades to a
    // lower frame rate instead of flashing an empty canvas.
    let img = images.current[current.current];
    if (!img) {
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (images.current[current.current - d]) { img = images.current[current.current - d]; break; }
        if (images.current[current.current + d]) { img = images.current[current.current + d]; break; }
      }
    }
    if (!img) return;

    const cw = canvas.width, ch = canvas.height;
    const ratio = Math.max(cw / img.width, ch / img.height);
    const dw = img.width * ratio, dh = img.height * ratio;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    lastDrawn.current = current.current;
  }, [canvasRef]);

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
   * Start the interlaced preload.
   *
   * Returns a promise that settles after the FIRST pass only — that is the
   * moment the sequence can be scrubbed end to end, and therefore the moment
   * the loader is allowed to lift. The finer passes are deliberately not
   * awaited: they keep running afterwards and quietly raise the frame rate
   * while the visitor is still on the first screen.
   *
   * `onProgress` reports across pass 1, so the bar reaching 100% coincides
   * with the loader lifting rather than promising more than it delivers.
   */
  const preload = useCallback((onProgress) => {
    // Fewer frames eventually on constrained devices.
    const light =
      window.matchMedia("(max-width: 860px)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    const passes = light ? PASSES_LIGHT : PASSES_FULL;

    // Each index is claimed once, so a later pass only fetches what the
    // coarser passes did not already cover.
    const claimed = new Set();
    const passIndices = (step) => {
      const out = [];
      for (let i = 0; i < FRAME_COUNT; i += step) {
        if (!claimed.has(i)) { claimed.add(i); out.push(i); }
      }
      return out;
    };

    const runPool = (list, onEach) => {
      if (!list.length) return Promise.resolve();
      let next = 0;
      const worker = async () => {
        while (next < list.length) {
          await loadFrame(list[next++]);
          onEach?.();
        }
      };
      return Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker)
      );
    };

    const first = passIndices(passes[0]);
    let done = 0;
    const gate = runPool(first, () => onProgress?.(++done / first.length));

    // Refinement continues after the gate resolves — sequentially, so the
    // coarse fill always completes before the network is spent on finer
    // detail, and never in parallel with the gate itself.
    gate.then(async () => {
      for (const step of passes.slice(1)) await runPool(passIndices(step));
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

  // Stable handle so effects that depend on `sequence` don't re-run each render.
  return useMemo(() => ({ setFrame, preload, frameCount: FRAME_COUNT }), [setFrame, preload]);
}
