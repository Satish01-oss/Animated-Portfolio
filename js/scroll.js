/* ============================================================
   scroll.js — Lenis smooth scroll, synchronised with ScrollTrigger
   ------------------------------------------------------------
   Lenis becomes the single source of truth for scroll position.
   GSAP's ticker drives Lenis' RAF loop so both run on ONE frame
   callback — two independent RAF loops would fight and jitter.
   ============================================================ */

window.App = window.App || {};

App.scroll = (function () {
  let lenis = null;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function init() {
    gsap.registerPlugin(ScrollTrigger);

    // The rail works with or without Lenis, so it starts either way.
    initProgress();

    // Reduced motion: leave native scrolling alone entirely.
    if (prefersReducedMotion) return null;

    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    // Any Lenis scroll event refreshes ScrollTrigger's internal position.
    lenis.on("scroll", ScrollTrigger.update);

    // One ticker, one frame. GSAP passes seconds; Lenis wants ms.
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    bindAnchors();
    return lenis;
  }

  /* ── Progress rail ────────────────────────────────────────
     Stands in for the hidden native scrollbar. Driven by the
     window's own scroll position rather than by Lenis, so it works
     identically when Lenis is off (reduced motion) — and it reads
     that position once per animation frame, never per scroll event.
     ───────────────────────────────────────────────────────── */

  function initProgress() {
    const el = document.querySelector(".progress");
    if (!el) return;

    const fill = document.getElementById("progressFill");
    const pct = document.getElementById("progressPct");
    const label = document.getElementById("progressLabel");

    let sections = [];
    let maxScroll = 1;
    let ticking = false;
    let lastPct = -1;
    let lastName = "";

    /** Cache section bounds so the scroll handler never reads layout. */
    function measure() {
      const y = window.scrollY;
      sections = [...document.querySelectorAll("[data-section]")].map((s) => {
        const r = s.getBoundingClientRect();
        return { name: s.dataset.section, top: r.top + y, bottom: r.bottom + y };
      });
      maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
    }

    function swapLabel(name) {
      if (name === lastName) return;
      lastName = name;
      label.classList.add("is-swapping");
      setTimeout(() => {
        label.textContent = name;
        label.classList.remove("is-swapping");
      }, 350);                       // matches the CSS opacity transition
    }

    function update() {
      ticking = false;
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, y / maxScroll));

      fill.style.transform = `scaleY(${p})`;

      const whole = Math.round(p * 100);
      if (whole !== lastPct) {
        lastPct = whole;
        pct.textContent = String(whole).padStart(2, "0");
      }

      // Whichever section owns the middle of the viewport is "current".
      const mid = y + window.innerHeight / 2;
      const current = sections.find((s) => mid >= s.top && mid < s.bottom);
      if (current) swapLabel(current.name);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    measure();
    update();
    el.classList.add("is-ready");

    window.addEventListener("scroll", onScroll, { passive: true });

    let t;
    window.addEventListener(
      "resize",
      () => { clearTimeout(t); t = setTimeout(() => { measure(); update(); }, 150); },
      { passive: true }
    );

    // Pinning changes document height, so re-measure whenever
    // ScrollTrigger recalculates.
    ScrollTrigger.addEventListener("refresh", () => { measure(); update(); });
  }

  /** Anchor links must go through Lenis, not the browser's jump. */
  function bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      });
    });
  }

  return { init, prefersReducedMotion, get instance() { return lenis; } };
})();
