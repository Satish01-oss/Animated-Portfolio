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

    // Preload every logo so the first hover is instant.
    const tools = [...section.querySelectorAll(".skills__tool")];
    const cache = new Map();
    tools.forEach((el) => {
      const url = el.dataset.logo;
      if (url && !cache.has(url)) {
        const im = new Image();
        im.src = url;
        cache.set(url, im);
      }
    });

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

    const hide = () => {
      if (!shown) return;
      shown = false;
      gsap.to(preview, { autoAlpha: 0, scale: 0.8, duration: 0.25, ease: "power2.out" });
    };

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

    return () => {
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseover", onOver);
      section.removeEventListener("mouseleave", hide);
      gsap.killTweensOf(preview);
    };
  }, [sectionRef, previewRef, imgRef]);
}
