import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * Cursor-following logo preview for the Skills list.
 *
 * Hovering a tool name shows that tool's official logo on a small tile that
 * trails the cursor; moving off a tool (or leaving the section) hides it.
 * Logos are preloaded once so the first hover never flickers.
 *
 * The tile has a solid light background on purpose: a few brand logos
 * (Express, GitHub) are black and would otherwise disappear on the dark
 * theme. Skipped on touch and under reduced motion, matching the rest of
 * the site — there the tool names are still perfectly readable text.
 */
export function useSkillsPreview(sectionRef, previewRef, imgRef) {
  useEffect(() => {
    const section = sectionRef.current;
    const preview = previewRef.current;
    const img = imgRef.current;
    if (!section || !preview || !img) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Preload every logo so the first hover is instant — but only once the
    // section is near. Fetched at mount, 22 third-party requests would
    // compete with the hero's frames for the first screen's bandwidth.
    const cache = new Map();
    const warm = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      warm.disconnect();
      section.querySelectorAll(".skills__tool").forEach((el) => {
        const url = el.dataset.logo;
        if (url && !cache.has(url)) {
          const im = new Image();
          im.src = url;
          cache.set(url, im);
        }
      });
    }, { rootMargin: "100% 0px" });
    warm.observe(section);

    gsap.set(preview, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.8 });

    // Trails the cursor with a soft lag.
    const opts = { duration: 0.5, ease: "power3.out" };
    const xTo = gsap.quickTo(preview, "x", opts);
    const yTo = gsap.quickTo(preview, "y", opts);

    let shown = false;
    let currentUrl = "";

    const show = (url) => {
      if (url !== currentUrl) {
        currentUrl = url;
        img.src = url;
      }
      if (!shown) {
        shown = true;
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" });
      }
    };

    /**
     * Hiding must not depend on `shown` being accurate.
     *
     * The tile is position:fixed, so whenever it is left up it parks itself
     * over whatever section the visitor has moved on to. The failure mode is
     * always the same shape: the DOM is visible while the flag says it is
     * not, and from there both the tween and any flag-gated listener decline
     * to act, so nothing ever takes it down again.
     *
     * So: tween when the flag agrees, and otherwise verify the DOM and force
     * it hidden if it disagrees. Self-healing beats enumerating the ways the
     * two can drift apart.
     */
    const hide = () => {
      if (!shown) {
        if (getComputedStyle(preview).visibility !== "hidden") {
          gsap.set(preview, { autoAlpha: 0, scale: 0.8 });
        }
        return;
      }
      shown = false;
      gsap.to(preview, { autoAlpha: 0, scale: 0.8, duration: 0.25, ease: "power2.out" });
    };

    /* The pointer is the authority on whether the tile belongs on screen, and
       it is watched at document level so this holds no matter how the visitor
       left the section — scroll, anchor jump, or a path nobody thought of. */
    const onDocMove = (e) => {
      if (e.target?.closest?.(".skills__tool")) return;
      hide();
    };
    document.addEventListener("pointermove", onDocMove, { passive: true });

    const onMove = (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    // One delegated handler: over a tool → show its logo, anywhere else → hide.
    const onOver = (e) => {
      const tool = e.target.closest(".skills__tool");
      if (tool) show(tool.dataset.logo);
      else hide();
    };

    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseover", onOver);
    section.addEventListener("mouseleave", hide);

    /* ── Escape hatches ───────────────────────────────────────
       The tile is position:fixed, so if it is ever left shown it floats
       over whatever section the visitor moves on to. `mouseleave` alone
       does not cover that: the pointer never moves — the PAGE moves out
       from under it — and Lenis scrolls programmatically, so the browser
       does not reliably re-evaluate hover or dispatch a leave event.

       Hiding on scroll is also the honest behaviour: the tile points at a
       tool name, and once that name has moved it is pointing at nothing. */
    window.addEventListener("scroll", hide, { passive: true });

    // Backstop for the case where the section leaves the viewport without
    // a scroll event this listener saw (anchor jumps, ScrollTrigger refresh).
    const io = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) hide(); },
      { threshold: 0 }
    );
    io.observe(section);

    // Pointer left the window entirely (tab switch, moved to the chrome).
    const onDocLeave = (e) => { if (!e.relatedTarget) hide(); };
    document.addEventListener("mouseout", onDocLeave);

    return () => {
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseover", onOver);
      section.removeEventListener("mouseleave", hide);
      window.removeEventListener("scroll", hide);
      document.removeEventListener("mouseout", onDocLeave);
      document.removeEventListener("pointermove", onDocMove);
      io.disconnect();
      warm.disconnect();
      gsap.killTweensOf(preview);
      // Killing the tweens can strand the tile mid-fade; put it back to
      // hidden so a re-mount never inherits a half-visible overlay.
      gsap.set(preview, { autoAlpha: 0, scale: 0.8 });
    };
  }, [sectionRef, previewRef, imgRef]);
}
