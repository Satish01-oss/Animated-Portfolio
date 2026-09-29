import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// The stretch of the hero sequence the ending replays, as fractions of it:
// from glancing away, through the profile turn, to the smile straight at the
// visitor the hero itself ends on.
const FROM = 0.5;
const TO = 1;

/**
 * The page's closing shot. The character from the opening returns beside
 * "Let's build" and, as the Contact section scrolls in, turns to face the
 * visitor — the same frames, already decoded, painted into a second canvas.
 *
 * Reduced motion gets the final frame, still.
 */
export function useBookend(enabled, canvasRef, sequence) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    const section = canvas.closest("section");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const last = sequence.frameCount - 1;
    const frameAt = (p) => Math.round(last * (FROM + (TO - FROM) * p));
    let frame = frameAt(reduced ? 1 : 0);
    let raf = null;
    const draw = () => {
      raf = null;
      sequence.paint(canvas, frame);
    };
    const request = () => { if (raf === null) raf = requestAnimationFrame(draw); };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      request();
    };
    resize();

    const st = reduced ? null : ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "top 15%",
      onUpdate: (self) => {
        const next = frameAt(self.progress);
        if (next === frame) return;
        frame = next;
        request();
      },
      onRefresh: (self) => {
        frame = frameAt(self.progress);
        resize();
      },
    });

    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(resize, 150); };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      st?.kill();
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [enabled, canvasRef, sequence]);
}
