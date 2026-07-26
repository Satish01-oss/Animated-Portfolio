import { useEffect } from "react";

/**
 * Custom cursor. The dot tracks the pointer exactly; the ring lerps behind
 * it for the "smooth" feel. Pointer position is recorded on mousemove but
 * written to the DOM once per animation frame, so 200 events/sec still
 * produce ~60 transform updates. Hover state is delegated from the document,
 * so links rendered by React are covered without per-element wiring.
 *
 * Skipped on touch and reduced-motion — those keep the native cursor.
 */
export function useCursor(rootRef) {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = rootRef.current;
    if (!root) return;
    const dot = root.querySelector(".cursor__dot");
    const ringEl = root.querySelector(".cursor__ring");
    const label = root.querySelector(".cursor__label");

    const target = { x: 0, y: 0 };
    const ring = { x: 0, y: 0 };
    const EASE = 0.16;
    let running = false;
    let rafId = null;

    document.body.style.cursor = "none";

    const loop = () => {
      ring.x += (target.x - ring.x) * EASE;
      ring.y += (target.y - ring.y) * EASE;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      ringEl.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(loop);
    };

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!running) {
        running = true;
        ring.x = target.x; ring.y = target.y;  // snap, don't fly in from (0,0)
        root.classList.add("is-ready");
        loop();
      }
    };

    // Delegated hover: find the nearest interactive ancestor.
    const HOVER = "a, button, [data-cursor], input, textarea";
    const onOver = (e) => {
      const el = e.target.closest(HOVER);
      if (!el) return;
      root.classList.add("is-hover");
      label.textContent = el.dataset.cursor || "";
    };
    const onOut = (e) => {
      const el = e.target.closest(HOVER);
      if (!el) return;
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      root.classList.remove("is-hover");
      label.textContent = "";
    };
    const onDown = () => root.classList.add("is-down");
    const onUp = () => root.classList.remove("is-down");

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, [rootRef]);
}
