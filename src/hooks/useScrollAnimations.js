import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

const DESKTOP = "(min-width: 861px) and (prefers-reduced-motion: no-preference)";
const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * All scroll-driven behaviour, scoped to a gsap.context so a single
 * revert() on cleanup kills every tween, ScrollTrigger and matchMedia
 * this hook created — which is what makes it safe under StrictMode's
 * mount/unmount/mount and any future re-run.
 *
 * Runs only once `enabled` (the page has been handed over), so every
 * trigger measures a settled layout.
 */
export function useScrollAnimations(enabled) {
  useEffect(() => {
    if (!enabled) return;

    // SplitType mutates the DOM and is NOT undone by gsap.context().revert(),
    // so we track every instance and revert them by hand on cleanup — otherwise
    // a re-run would split already-split markup into nested garbage.
    const splits = [];
    const root = document.documentElement;
    let ctx;

    try {
      ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // (The hero and the Profile are one pinned shot with its own timeline —
      // see useIntro. The Work chapter is useWork.)

      // ── The lights ──────────────────────────────────────────
      // --dim (see global.css) takes the page down to near-black on the way
      // into the Work chapter and back up on the way out. Two triggers, one
      // formula: whichever fired last, the value is always the product of
      // both, so a jump, a flick or a refresh mid-page all land correctly.
      const work = document.querySelector("#work");
      if (work) {
        let down = null;
        let up = null;
        const apply = () => {
          const d = (down ? down.progress : 0) * (1 - (up ? up.progress : 0));
          root.style.setProperty("--dim", d.toFixed(3));
        };
        down = ScrollTrigger.create({
          trigger: work, start: "top 95%", end: "top 15%",
          onUpdate: apply, onRefresh: apply,
        });
        up = ScrollTrigger.create({
          trigger: work, start: "bottom bottom", end: "bottom 25%",
          onUpdate: apply, onRefresh: apply,
        });
      }

      // ── Split-character headings ────────────────────────────
      mm.add(MOTION_OK, () => {
        document.querySelectorAll("[data-split-chars]").forEach((el) => {
          const split = new SplitType(el, { types: "chars" });
          splits.push(split);
          gsap.from(split.chars, {
            yPercent: 60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.025,
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });
      });

      // ── Drawn rules ─────────────────────────────────────────
      // Triggered, not scrubbed. A scrubbed line stops wherever the reader
      // stops — a table full of hairlines frozen at different lengths reads
      // as broken. Drawn once, on arrival, every line ends up whole.
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray("[data-draw]").forEach((el) => {
          gsap.fromTo(el, { scaleX: 0 }, {
            scaleX: 1, duration: 1.2, ease: "power3.inOut",
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });
      });

      // ── Staggered lists ─────────────────────────────────────
      // [data-stagger="<delay>"]: the list's items rise in one after another
      // on arrival; the delay lets sibling lists (the Skills columns) cascade.
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray("[data-stagger]").forEach((el) => {
          gsap.from(el.children, {
            y: 14, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.05,
            delay: parseFloat(el.dataset.stagger) || 0,
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });
      });

      // ── Rising type ─────────────────────────────────────────
      // [data-rise]: the element masks its child, which rises into view once
      // on arrival — a single transform, nothing tied to scroll after that.
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray("[data-rise]").forEach((el) => {
          gsap.from(el.children, {
            yPercent: 100, duration: 1.3, ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 95%" },
          });
        });
      });

      // ── Generic reveals ─────────────────────────────────────
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      // ── Magnetic buttons ────────────────────────────────────
      mm.add(DESKTOP, () => {
        const items = gsap.utils.toArray(".magnetic");
        const bound = [];
        items.forEach((el) => {
          const move = (e) => {
            const r = el._rect || (el._rect = el.getBoundingClientRect());
            const x = (e.clientX - (r.left + r.width / 2)) * 0.35;
            const y = (e.clientY - (r.top + r.height / 2)) * 0.35;
            gsap.to(el, { x, y, duration: 0.6, ease: "power3.out" });
          };
          const enter = () => { el._rect = el.getBoundingClientRect(); };
          const leave = () => { el._rect = null; gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }); };
          el.addEventListener("mouseenter", enter);
          el.addEventListener("mousemove", move);
          el.addEventListener("mouseleave", leave);
          bound.push([el, enter, move, leave]);
        });
        return () => bound.forEach(([el, enter, move, leave]) => {
          el.removeEventListener("mouseenter", enter);
          el.removeEventListener("mousemove", move);
          el.removeEventListener("mouseleave", leave);
          gsap.set(el, { x: 0, y: 0 });
        });
      });

      // ── Parallax on section index labels ────────────────────
      // Only the ones in ordinary flow: the Profile's and Work's live on pinned
      // stages, where "scrolling past" has no meaning.
      mm.add(DESKTOP, () => {
        gsap.utils.toArray(".section__index").filter((el) => !el.closest(".hero, .work")).forEach((el) => {
          gsap.to(el, {
            y: -40, ease: "none",
            scrollTrigger: { trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      });

      ScrollTrigger.refresh();
      });
    } catch (err) {
      // Catastrophic init failure must never leave content stranded at
      // opacity 0 — force every reveal visible instead.
      console.error("Scroll animations failed to initialise.", err);
      document.documentElement.classList.add("reveal-failsafe");
    }

    return () => {
      ctx?.revert();
      splits.forEach((s) => s.revert());
      root.style.removeProperty("--dim");
    };
  }, [enabled]);
}
