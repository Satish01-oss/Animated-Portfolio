/* ============================================================
   canvas.js — image-sequence renderer
   ------------------------------------------------------------
   Responsibilities: load frames, size the canvas, draw ONE frame.
   It knows nothing about scrolling — animation.js feeds it a
   frame index. Keeping the two apart means the sequence can be
   driven by scroll, a timer, or a slider without edits here.

   Performance notes:
   • Frames load in two waves. The first PRIORITY_COUNT frames are
     fetched before the loader lifts so the opening never shows a
     blank canvas; the remaining ~260 stream in behind the scenes
     with a capped number of parallel requests (a 300-way parallel
     fetch would saturate the connection and stall the first paint).
   • Draws are dirty-flagged and scheduled on requestAnimationFrame.
     Several setFrame() calls inside one frame collapse into a
     single drawImage instead of redrawing per scroll event.
   • The backing store is sized to devicePixelRatio (capped at 2)
     once per resize, and the resize handler is debounced, so we
     never reallocate the buffer mid-scroll.
   ============================================================ */

window.App = window.App || {};

App.canvas = (function () {
  const FRAME_COUNT = 300;
  const PRIORITY_COUNT = 40;   // frames gating the loader
  const CONCURRENCY = 8;       // parallel requests in the background wave

  const images = new Array(FRAME_COUNT);
  let canvas, ctx;
  let currentFrame = 0;
  let lastDrawn = -1;
  let dirty = false;
  let rafId = null;
  let dpr = 1;

  const framePath = (i) =>
    `assets/sequence/male${String(i + 1).padStart(4, "0")}.png`;

  /* ── Loading ──────────────────────────────────────────── */

  function loadFrame(index) {
    return new Promise((resolve) => {
      if (images[index]) return resolve(images[index]);
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        images[index] = img;
        // The first frame to arrive should appear immediately.
        if (lastDrawn === -1) markDirty();
        resolve(img);
      };
      img.onerror = () => resolve(null); // a missing frame must not stall the chain
      img.src = framePath(index);
    });
  }

  /** Load [from, to) with at most CONCURRENCY requests in flight. */
  function loadRange(from, to, onProgress) {
    let next = from;
    let done = 0;
    const total = to - from;

    const worker = async () => {
      while (next < to) {
        const index = next++;
        await loadFrame(index);
        done++;
        if (onProgress) onProgress(done / total);
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, total) },
      worker
    );
    return Promise.all(workers);
  }

  /**
   * Preload the priority wave, then hand control back. The remaining
   * frames continue loading in the background — the returned promise
   * intentionally does NOT wait for them.
   */
  function preload(onProgress) {
    return loadRange(0, PRIORITY_COUNT, onProgress).then(() => {
      loadRange(PRIORITY_COUNT, FRAME_COUNT);
    });
  }

  /* ── Sizing ───────────────────────────────────────────── */

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    markDirty(true);
  }

  /* ── Drawing ──────────────────────────────────────────── */

  /**
   * If the exact frame hasn't downloaded yet, use the closest one we
   * do have. Scrubbing then degrades to a lower frame rate instead of
   * flashing an empty canvas.
   */
  function nearestLoaded(index) {
    if (images[index]) return images[index];
    for (let d = 1; d < FRAME_COUNT; d++) {
      if (images[index - d]) return images[index - d];
      if (images[index + d]) return images[index + d];
    }
    return null;
  }

  /** Cover-fit: fill the canvas, preserve aspect ratio, centre the overflow. */
  function draw() {
    rafId = null;
    dirty = false;

    const img = nearestLoaded(currentFrame);
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const ratio = Math.max(cw / img.width, ch / img.height);
    const dw = img.width * ratio;
    const dh = img.height * ratio;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    lastDrawn = currentFrame;
  }

  function markDirty(force) {
    if (dirty && !force) return;
    dirty = true;
    if (rafId === null) rafId = requestAnimationFrame(draw);
  }

  /** Public: request a frame. Redundant calls are free. */
  function setFrame(index) {
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));
    if (clamped === currentFrame && lastDrawn === clamped) return;
    currentFrame = clamped;
    markDirty();
  }

  /* ── Init ─────────────────────────────────────────────── */

  function init(selector) {
    canvas = document.querySelector(selector);
    if (!canvas) return null;
    ctx = canvas.getContext("2d", { alpha: true });

    resize();

    // Debounced resize: reallocating the backing store is expensive,
    // and a drag-resize fires dozens of events per second.
    let resizeTimer;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
      },
      { passive: true }
    );

    return { setFrame, preload, frameCount: FRAME_COUNT };
  }

  return { init, frameCount: FRAME_COUNT };
})();
