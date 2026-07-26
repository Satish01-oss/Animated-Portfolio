import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * Cursor-reactive parallax for the hero character.
 *
 * As the pointer moves over the hero, the canvas gently shifts and tilts
 * toward the cursor; on leave it springs back to rest. Because the marquee
 * text sits on a separate layer *behind* the canvas, the character appears
 * to float in front of it — reinforcing the existing depth trick.
 *
 * This only transforms the canvas ELEMENT (a composited GPU transform), so
 * it never touches the scroll-scrubbed drawImage loop that paints the
 * frames. The two effects are fully independent.
 *
 * Skipped on touch devices and under prefers-reduced-motion.
 */
export function useCharacterHover(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The pointer region is the whole pinned hero, so moving over the
    // captions and marquee counts too.
    const area = canvas.closest(".hero__sticky") || canvas.parentElement;
    if (!area) return;

    // A constant slight overscale gives headroom: the parallax translate can
    // never pull a canvas edge inward far enough to expose the background.
    const BASE_SCALE = 1.06;
    const MAX_SHIFT = 2.2;   // % of the canvas, translate
    const MAX_TILT = 3;      // degrees
    const LIFT = 0.02;       // extra scale while hovering

    gsap.set(canvas, {
      scale: BASE_SCALE,
      transformPerspective: 1000,
      transformOrigin: "50% 50%",
      force3D: true,
    });

    // quickTo gives a cheap, buttery interpolation toward each new target
    // without spawning a tween per mousemove.
    const opts = { duration: 0.9, ease: "power3.out" };
    const xTo = gsap.quickTo(canvas, "xPercent", opts);
    const yTo = gsap.quickTo(canvas, "yPercent", opts);
    const rxTo = gsap.quickTo(canvas, "rotationX", opts);
    const ryTo = gsap.quickTo(canvas, "rotationY", opts);
    const scTo = gsap.quickTo(canvas, "scale", opts);

    const onMove = (e) => {
      const r = area.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);   // -1..1
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);  // -1..1
      xTo(nx * MAX_SHIFT);
      yTo(ny * MAX_SHIFT);
      ryTo(nx * MAX_TILT);    // turn toward the cursor horizontally
      rxTo(-ny * MAX_TILT);   // and vertically
      scTo(BASE_SCALE + LIFT);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
      rxTo(0);
      ryTo(0);
      scTo(BASE_SCALE);
    };

    area.addEventListener("mousemove", onMove);
    area.addEventListener("mouseleave", onLeave);

    return () => {
      area.removeEventListener("mousemove", onMove);
      area.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(canvas);
      gsap.set(canvas, { clearProps: "transform" });
    };
  }, [canvasRef]);
}
