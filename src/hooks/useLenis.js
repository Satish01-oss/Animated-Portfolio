import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Smooth scroll (Lenis) driven from GSAP's single ticker so both run on one
 * frame callback, plus the progress-rail wiring. `enabled` gates start-up:
 * App turns it on only once the page is handed over, so ScrollTrigger measures a
 * fully-laid-out, unlocked page. Reduced motion skips Lenis entirely but
 * still drives the rail from native scroll.
 *
 * railRefs: { fill, pct, label } refs into <ProgressRail>.
 */
export function useLenis(enabled, railRefs) {
  useEffect(() => {
    if (!enabled) return;

    let lenis = null;
    let rafId = null;
    let onClick = null;
    const reduced = prefersReducedMotion();

    if (!reduced) {
      // If Lenis ever fails to construct, we simply skip it — the page keeps
      // its perfectly good native scroll rather than ending up with wheel
      // events captured and nothing moving.
      try {
        lenis = new Lenis({
          duration: 1.1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.6,
        });
        lenis.on("scroll", ScrollTrigger.update);

        // Lenis drives its OWN requestAnimationFrame loop. This is more
        // robust than piggy-backing on gsap.ticker: nothing else can pause
        // it, so the wheel can never be intercepted-but-not-scrolled.
        const raf = (time) => {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);

        // Route in-page anchors through Lenis rather than the native jump.
        onClick = (e) => {
          const link = e.target.closest('a[href^="#"]');
          if (!link) return;
          const target = document.querySelector(link.getAttribute("href"));
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: 0, duration: 1.4 });
        };
        document.addEventListener("click", onClick);

        // Recompute Lenis' scroll limit once the pinned sections have
        // established the final document height.
        requestAnimationFrame(() => lenis && lenis.resize());
      } catch (err) {
        console.warn("Lenis failed to init; falling back to native scroll.", err);
        lenis = null;
      }
    }

    const cleanupLenis = () => {
      if (onClick) document.removeEventListener("click", onClick);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
    };

    // ── Progress rail ──────────────────────────────────────────
    const el = document.querySelector(".progress");
    let sections = [];
    let maxScroll = 1;
    let ticking = false;
    let lastPct = -1;
    let lastName = "";
    let swapTimer;

    const measure = () => {
      const y = window.scrollY;
      sections = [...document.querySelectorAll("[data-section]")].map((s) => {
        const r = s.getBoundingClientRect();
        return { name: s.dataset.section, top: r.top + y, bottom: r.bottom + y };
      });
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };

    const swapLabel = (name) => {
      const label = railRefs.label.current;
      if (!label || name === lastName) return;
      lastName = name;
      label.classList.add("is-swapping");
      clearTimeout(swapTimer);
      swapTimer = setTimeout(() => {
        label.textContent = name;
        label.classList.remove("is-swapping");
      }, 350);
    };

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, y / maxScroll));
      if (railRefs.fill.current) railRefs.fill.current.style.transform = `scaleY(${p})`;
      const whole = Math.round(p * 100);
      if (whole !== lastPct && railRefs.pct.current) {
        lastPct = whole;
        railRefs.pct.current.textContent = String(whole).padStart(2, "0");
      }
      const mid = y + window.innerHeight / 2;
      // The LAST match, not the first: Profile is a range nested inside the
      // hero, and the innermost section is the one the visitor is reading.
      let cur = null;
      for (const s of sections) if (mid >= s.top && mid < s.bottom) cur = s;
      if (cur) swapLabel(cur.name);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    measure();
    update();
    el?.classList.add("is-ready");
    window.addEventListener("scroll", onScroll, { passive: true });

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { measure(); update(); }, 150);
    };
    window.addEventListener("resize", onResize, { passive: true });
    const onRefresh = () => { measure(); update(); };
    ScrollTrigger.addEventListener("refresh", onRefresh);

    return () => {
      cleanupLenis?.();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      clearTimeout(swapTimer);
      clearTimeout(resizeTimer);
    };
  }, [enabled, railRefs]);
}
