/* ============================================================
   animation.js — every scroll-driven behaviour lives here
   ------------------------------------------------------------
   Each function owns one section. gsap.matchMedia() scopes the
   heavier effects to desktop and tears them down automatically
   when the viewport crosses a breakpoint, so mobile never pays
   for a pin it can't use.
   ============================================================ */

window.App = window.App || {};

App.animation = (function () {
  const mm = gsap.matchMedia();
  const DESKTOP = "(min-width: 861px) and (prefers-reduced-motion: no-preference)";
  const MOTION_OK = "(prefers-reduced-motion: no-preference)";

  /* ── Hero: scroll position → frame index ──────────────── */

  function heroSequence(sequence) {
    if (!sequence) return;

    const hero = document.querySelector(".hero");
    const captions = gsap.utils.toArray(".hero__caption");

    mm.add(MOTION_OK, () => {
      // A plain object tweened by ScrollTrigger; onUpdate forwards the
      // value to the canvas. scrub smooths the wheel's stepped input
      // into continuous playback.
      const state = { frame: 0 };

      const st = ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          state.frame = self.progress * (sequence.frameCount - 1);
          sequence.setFrame(state.frame);
          swapCaption(captions, self.progress);
        },
      });

      return () => st.kill();
    });

    // Reduced motion: no scrubbing at all — show one representative frame.
    if (App.scroll.prefersReducedMotion) {
      sequence.setFrame(Math.floor(sequence.frameCount / 2));
    }
  }

  /**
   * Split the pinned scroll into equal bands, one per caption.
   * Only touches the DOM when the active index actually changes.
   */
  let activeCaption = -1;
  function swapCaption(captions, progress) {
    const index = Math.min(
      captions.length - 1,
      Math.floor(progress * captions.length)
    );
    if (index === activeCaption) return;
    activeCaption = index;
    captions.forEach((el, i) => el.classList.toggle("is-active", i === index));
  }

  /* ── Split-text headings ──────────────────────────────── */

  function splitText() {
    mm.add(MOTION_OK, () => {
      // Lines: masked by CSS overflow, slide up on enter.
      document.querySelectorAll("[data-split-lines]").forEach((el) => {
        const split = new SplitType(el, { types: "lines", lineClass: "line" });
        // Wrap so the mask has something to clip.
        split.lines.forEach((line) => {
          const inner = document.createElement("span");
          inner.style.display = "block";
          while (line.firstChild) inner.appendChild(line.firstChild);
          line.appendChild(inner);
        });

        gsap.from(
          split.lines.map((l) => l.firstChild),
          {
            yPercent: 110,
            duration: 1.1,
            ease: "power4.out",
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: "top 82%" },
          }
        );
      });

      // Chars: a soft rise, staggered from the left.
      document.querySelectorAll("[data-split-chars]").forEach((el) => {
        const split = new SplitType(el, { types: "chars" });
        gsap.from(split.chars, {
          yPercent: 60,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.025,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
    });
  }

  /* ── Generic reveals ──────────────────────────────────── */

  function reveals() {
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
  }

  /* ── Work: vertical scroll → horizontal travel ────────── */

  function horizontalWork() {
    mm.add(DESKTOP, () => {
      const track = document.querySelector("#workTrack");
      const section = document.querySelector(".work");
      if (!track || !section) return;

      // Distance the track must travel to bring its last card flush
      // with the right edge. Read once, refreshed by ScrollTrigger.
      const getDistance = () => track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + getDistance(),
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      return () => tween.scrollTrigger && tween.scrollTrigger.kill();
    });
  }

  /* ── Magnetic buttons ─────────────────────────────────── */

  function magnetic() {
    mm.add(DESKTOP, () => {
      const items = gsap.utils.toArray(".magnetic");
      const handlers = [];

      items.forEach((el) => {
        const move = (e) => {
          // getBoundingClientRect on every mousemove is the usual
          // culprit for jank here, so cache it on enter instead.
          const r = el._rect || (el._rect = el.getBoundingClientRect());
          const x = (e.clientX - (r.left + r.width / 2)) * 0.35;
          const y = (e.clientY - (r.top + r.height / 2)) * 0.35;
          gsap.to(el, { x, y, duration: 0.6, ease: "power3.out" });
        };
        const enter = () => { el._rect = el.getBoundingClientRect(); };
        const leave = () => {
          el._rect = null;
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
        };

        el.addEventListener("mouseenter", enter);
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        handlers.push([el, enter, move, leave]);
      });

      return () => {
        handlers.forEach(([el, enter, move, leave]) => {
          el.removeEventListener("mouseenter", enter);
          el.removeEventListener("mousemove", move);
          el.removeEventListener("mouseleave", leave);
          gsap.set(el, { x: 0, y: 0 });
        });
      };
    });
  }

  /* ── Section parallax on the index labels ─────────────── */

  function parallax() {
    mm.add(DESKTOP, () => {
      gsap.utils.toArray(".section__index").forEach((el) => {
        gsap.to(el, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section"),
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    });
  }

  function init(sequence) {
    heroSequence(sequence);
    splitText();
    reveals();
    horizontalWork();
    magnetic();
    parallax();
    ScrollTrigger.refresh();
  }

  return { init };
})();
