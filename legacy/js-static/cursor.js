/* ============================================================
   cursor.js — custom cursor
   ------------------------------------------------------------
   The dot tracks the pointer exactly; the ring lags behind via
   linear interpolation, which is what reads as "smooth". The
   pointer position is only *recorded* on mousemove — the write
   to the DOM happens once per animation frame, so a fast mouse
   producing 200 events/sec still causes 60 transform updates.
   ============================================================ */

window.App = window.App || {};

App.cursor = (function () {
  const EASE = 0.16;              // ring follow strength (0 = never arrives, 1 = instant)
  const target = { x: 0, y: 0 };  // true pointer position
  const ring = { x: 0, y: 0 };    // interpolated position

  let root, dot, ringEl, label, running = false;

  function loop() {
    ring.x += (target.x - ring.x) * EASE;
    ring.y += (target.y - ring.y) * EASE;

    dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
    ringEl.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;

    requestAnimationFrame(loop);
  }

  function bindHoverTargets() {
    const selector = 'a, button, [data-cursor], input, textarea';
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("mouseenter", () => {
        root.classList.add("is-hover");
        label.textContent = el.dataset.cursor || "";
      });
      el.addEventListener("mouseleave", () => {
        root.classList.remove("is-hover");
        label.textContent = "";
      });
    });
  }

  function init() {
    // Touch devices and reduced-motion users keep the native cursor.
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    root = document.querySelector(".cursor");
    if (!root) return;
    dot = root.querySelector(".cursor__dot");
    ringEl = root.querySelector(".cursor__ring");
    label = root.querySelector(".cursor__label");

    document.body.style.cursor = "none";

    window.addEventListener(
      "mousemove",
      (e) => {
        target.x = e.clientX;
        target.y = e.clientY;
        if (!running) {           // start the loop on first real movement
          running = true;
          ring.x = target.x;      // snap, so it doesn't fly in from (0,0)
          ring.y = target.y;
          root.classList.add("is-ready");
          loop();
        }
      },
      { passive: true }
    );

    window.addEventListener("mousedown", () => root.classList.add("is-down"), { passive: true });
    window.addEventListener("mouseup", () => root.classList.remove("is-down"), { passive: true });

    bindHoverTargets();
  }

  return { init };
})();
