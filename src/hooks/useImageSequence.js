import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createFrameLoader, createFrameDecoder, frameOrder, loadImage, nearestFrame } from '../lib/imageSequenceLoader.js';

const FRAME_COUNT = 150;
const defaultFramePath = (i) => `${import.meta.env.BASE_URL}assets/sequence/male${String(i + 1).padStart(4, '0')}.webp`;
function deviceSteps() {
  const net = navigator.connection;
  if (net && (net.saveData || /2g|3g/.test(net.effectiveType || ''))) return [8, 4];
  return window.matchMedia('(max-width: 860px), (pointer: coarse)').matches ? [8, 4, 2] : [8, 4, 2, 1];
}

// framePath can select a separately validated asset set without changing pose mapping.
export function useImageSequence(canvasRef, framePath = defaultFramePath) {
  const state = useRef(null);
  if (!state.current) state.current = {
    images: new Array(FRAME_COUNT), decoder: createFrameDecoder(), current: 0,
    drawn: null, raf: null, decoding: false, loader: null, gate: null,
    allowed: [0], disposed: false, backgroundPaused: false, revision: 0, drawnRevision: -1,
  };

  const draw = useCallback(() => {
    const s = state.current;
    s.raf = null;
    if (s.disposed) return;
    const canvas = canvasRef.current;
    const image = s.images[nearestFrame(s.images, s.current)];
    if (!canvas || !image) return;
    if (!s.decoder.has(image)) {
      if (!s.decoding) {
        s.decoding = true;
        s.decoder.decode(image).then(() => {
          s.decoding = false;
          if (!s.disposed && s.raf === null) s.raf = requestAnimationFrame(draw);
        });
      }
      return;
    }
    if (s.drawn === image && s.drawnRevision === s.revision) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !image.naturalWidth || !canvas.width || !canvas.height) return;
    const ratio = Math.max(canvas.width / image.width, canvas.height / image.height);
    const width = image.width * ratio, height = image.height * ratio;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) * 0.15, width, height);
    s.drawn = image;
    s.drawnRevision = s.revision;
  }, [canvasRef]);

  const markDirty = useCallback(() => {
    const s = state.current;
    if (!s.disposed && s.raf === null) s.raf = requestAnimationFrame(draw);
  }, [draw]);

  const setFrame = useCallback((value) => {
    const s = state.current;
    s.current = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(value)));
    // Preserve the existing phone/Save-Data selection, prioritizing its closest pose.
    const target = s.allowed.reduce((best, index) =>
      Math.abs(index - s.current) < Math.abs(best - s.current) ? index : best, 0);
    s.loader?.request(target, true);
    markDirty();
  }, [markDirty]);

  const preload = useCallback(() => {
    const s = state.current;
    if (s.gate) return s.gate;
    s.disposed = false;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    s.allowed = reduce ? [0] : frameOrder(FRAME_COUNT, deviceSteps());
    s.loader = createFrameLoader({
      load: (index, signal) => loadImage(framePath(index), signal, index === 0 ? 'high' : 'low'),
      onLoad: (index, image) => {
        s.images[index] = image;
        // Replace a stale fallback even if the visitor has stopped scrolling.
        if (nearestFrame(s.images, s.current) === index) markDirty();
      },
    });
    s.loader.setBackgroundPaused(s.backgroundPaused);
    s.gate = s.loader.request(0, true).then(async (image) => {
      if (s.disposed) return;
      if (image) await s.decoder.decode(image);
      if (s.disposed) return;
      markDirty();
      for (const index of s.allowed) s.loader.request(index);
    });
    return s.gate;
  }, [framePath, markDirty]);

  useEffect(() => {
    const s = state.current;
    s.disposed = false;
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(canvas.clientWidth * dpr), height = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        s.revision++;
      }
      markDirty();
    };
    resize();
    // Do not let optional hero detail compete with Work's lazy WebGL chunk.
    // Already-started transfers finish; opening/current requests bypass this gate.
    const hero = canvasRef.current?.closest?.('.hero');
    const observer = hero && typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          s.backgroundPaused = !entry.isIntersecting;
          s.loader?.setBackgroundPaused(s.backgroundPaused);
        }, { rootMargin: '100% 0px' }) : null;
    if (hero) observer?.observe(hero);
    let timer;
    const onResize = () => { clearTimeout(timer); timer = setTimeout(resize, 150); };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      s.disposed = true;
      observer?.disconnect();
      s.loader?.dispose();
      if (s.raf !== null) cancelAnimationFrame(s.raf);
      s.raf = null;
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [canvasRef, markDirty]);

  return useMemo(() => ({ setFrame, preload, frameCount: FRAME_COUNT }), [setFrame, preload]);
}
