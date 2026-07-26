import { useCallback, useEffect, useMemo, useRef } from "react";

const FRAME_COUNT = 300;
const PRIORITY_COUNT = 40;   // frames that gate the loader
const CONCURRENCY = 8;

const pad = (n) => String(n).padStart(4, "0");
const framePath = (i) =>
  `${import.meta.env.BASE_URL}assets/sequence/male${pad(i + 1)}.webp`;

/**
 * Loads a WebP image sequence and renders one frame to a <canvas>.
 * Knows nothing about scroll — the caller drives it with setFrame().
 *
 * Loadability:
 *  • WebP frames (~70% smaller than the PNG originals).
 *  • Coarse-pointer / narrow devices load every 2nd frame (stride 2),
 *    roughly halving the payload; gaps fall back to the nearest frame.
 *  • The first PRIORITY_COUNT frames resolve before the loader lifts;
 *    the rest stream in behind, capped at CONCURRENCY parallel requests.
 *  • Draws are dirty-flagged onto requestAnimationFrame, so many
 *    setFrame() calls in one frame collapse into a single drawImage.
 */
export function useImageSequence(canvasRef) {
  const images = useRef(new Array(FRAME_COUNT));
  const current = useRef(0);
  const lastDrawn = useRef(-1);
  const rafId = useRef(null);
  const stride = useRef(1);

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
   * Preload the priority wave (reporting progress), then hand back while
   * the remaining frames continue loading in the background.
   */
  const preload = useCallback((onProgress) => {
    // Fewer frames on constrained devices.
    const light =
      window.matchMedia("(max-width: 860px)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    stride.current = light ? 2 : 1;

    const indices = [];
    for (let i = 0; i < FRAME_COUNT; i += stride.current) indices.push(i);
    const priority = indices.slice(0, PRIORITY_COUNT);
    const rest = indices.slice(PRIORITY_COUNT);

    let done = 0;
    const runPool = (list, report) => {
      let next = 0;
      const worker = async () => {
        while (next < list.length) {
          await loadFrame(list[next++]);
          if (report) { done++; onProgress?.(done / priority.length); }
        }
      };
      return Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker)
      );
    };

    return runPool(priority, true).then(() => {
      runPool(rest, false);   // background; intentionally not awaited
    });
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
