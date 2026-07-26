/* ============================================================
   main.js — bootstrap
   ------------------------------------------------------------
   Order matters:
   1. Lenis first, so ScrollTrigger measures against the real
      scroller from the very first trigger it creates.
   2. Canvas next, so the priority frames are already in flight
      while the rest of the page wires up.
   3. Animations only after those frames land — creating pins
      before the loader lifts would measure a locked-scroll page.
   ============================================================ */

window.App = window.App || {};

(function () {
  const loader = document.getElementById("loader");
  const loaderFill = document.getElementById("loaderFill");
  const loaderPct = document.getElementById("loaderPct");

  function setProgress(ratio) {
    const pct = Math.round(ratio * 100);
    loaderFill.style.width = pct + "%";
    loaderPct.textContent = pct;
  }

  function hideLoader() {
    setProgress(1);
    loader.classList.add("is-done");
    setTimeout(() => loader.remove(), 900);
  }

  /* ── Theme toggle ─────────────────────────────────────── */

  /**
   * The OS preference is the default. Clicking the toggle records an
   * explicit override in localStorage; until someone does that, the
   * page keeps following the system — including live changes, which
   * is what happens when the OS flips at sunset.
   */
  function initTheme() {
    const btn = document.getElementById("themeToggle");
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const read = (key) => {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    };

    const paint = (theme) => {
      root.setAttribute("data-theme", theme);
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    };

    const systemTheme = () => (media.matches ? "dark" : "light");

    // The inline head script already painted this; sync the button state.
    paint(read("theme") || systemTheme());

    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch (e) {}
      paint(next);
    });

    // Follow the OS only while no explicit choice has been stored.
    const onSystemChange = () => { if (!read("theme")) paint(systemTheme()); };
    if (media.addEventListener) media.addEventListener("change", onSystemChange);
    else media.addListener(onSystemChange);          // older Safari
  }

  /* ── Boot ─────────────────────────────────────────────── */

  function boot() {
    document.getElementById("year").textContent = new Date().getFullYear();

    initTheme();
    App.scroll.init();
    App.cursor.init();

    const sequence = App.canvas.init("#sequence");

    if (!sequence) {          // canvas missing — still show the page
      hideLoader();
      App.animation.init(null);
      return;
    }

    sequence.preload(setProgress).then(() => {
      hideLoader();
      App.animation.init(sequence);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
