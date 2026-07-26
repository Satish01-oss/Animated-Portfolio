import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

const DESKTOP = "(min-width: 861px) and (prefers-reduced-motion: no-preference)";
const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * All scroll-driven behaviour, scoped to a gsap.context so a single
 * revert() on cleanup kills every tween, ScrollTrigger and matchMedia
 * this hook created — which is what makes it safe under StrictMode's
 * mount/unmount/mount and any future re-run.
 *
 * Runs only once `enabled` (loader lifted), so every trigger measures a
 * settled layout.
 */
export function useScrollAnimations(enabled, sequence) {
  useEffect(() => {
    if (!enabled) return;

    // SplitType mutates the DOM and is NOT undone by gsap.context().revert(),
    // so we track every instance and revert them by hand on cleanup — otherwise
    // a re-run would split already-split markup into nested garbage.
    const splits = [];
    let ctx;

    try {
      ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ── Hero: scroll → frame index, with caption swaps ──────
      const hero = document.querySelector(".hero");
      const captions = gsap.utils.toArray(".hero__caption");
      let activeCaption = -1;

      const swapCaption = (progress) => {
        const i = Math.min(captions.length - 1, Math.floor(progress * captions.length));
        if (i === activeCaption) return;
        activeCaption = i;
        captions.forEach((el, n) => el.classList.toggle("is-active", n === i));
      };

      if (reduced()) {
        sequence.setFrame(Math.floor(sequence.frameCount / 2));
      } else if (hero) {
        mm.add(MOTION_OK, () => {
          const st = ScrollTrigger.create({
            trigger: hero,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            onUpdate: (self) => {
              sequence.setFrame(self.progress * (sequence.frameCount - 1));
              swapCaption(self.progress);
            },
          });
          return () => st.kill();
        });
      }

      // ── Split-text headings ─────────────────────────────────
      mm.add(MOTION_OK, () => {
        document.querySelectorAll("[data-split-lines]").forEach((el) => {
          const split = new SplitType(el, { types: "lines", lineClass: "line" });
          splits.push(split);
          split.lines.forEach((line) => {
            const inner = document.createElement("span");
            inner.style.display = "block";
            while (line.firstChild) inner.appendChild(line.firstChild);
            line.appendChild(inner);
          });
          gsap.from(split.lines.map((l) => l.firstChild), {
            yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.09,
            scrollTrigger: { trigger: el, start: "top 82%" },
          });
        });

        document.querySelectorAll("[data-split-chars]").forEach((el) => {
          const split = new SplitType(el, { types: "chars" });
          splits.push(split);
          gsap.from(split.chars, {
            yPercent: 60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.025,
            scrollTrigger: { trigger: el, start: "top 85%" },
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

      // ── Work: vertical scroll → horizontal travel ───────────
      mm.add(DESKTOP, () => {
        const track = document.querySelector("#workTrack");
        const section = document.querySelector(".work");
        if (!track || !section) return;
        const distance = () => track.scrollWidth - window.innerWidth;
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section, start: "top top", end: () => "+=" + distance(),
            pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
          },
        });
        return () => tween.scrollTrigger?.kill();
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
      mm.add(DESKTOP, () => {
        gsap.utils.toArray(".section__index").forEach((el) => {
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
    };
  }, [enabled, sequence]);
}
