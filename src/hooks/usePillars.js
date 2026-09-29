import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// The choreography only makes sense with three cards side by side, so it is
// desktop-only; below this the CSS stacks them and nothing is pinned.
const DESKTOP = "(min-width: 1000px) and (prefers-reduced-motion: no-preference)";

// Progress milestones along the pinned scroll, kept together so the timing
// of the whole sequence can be read at a glance.
const HEADER_IN = [0.10, 0.25];   // heading rises and fades in
const NARROW_TO = 0.25;           // row has finished narrowing by here
const SPLIT_AT  = 0.35;           // cards separate into three objects
const FLIP_AT   = 0.70;           // cards turn to reveal the live projects

// Row width, as a percentage of the stage, in each resting state.
const WIDTH_JOINED = 60;   // the slab: one photograph, three panels
const WIDTH_FANNED = 76;   // face-up: each card carries a whole project

// Fan geometry once the cards are face-up. The tilt swings a card's base
// sideways by height × sin(tilt); SPREAD + GAP must exceed that or a card
// covers its neighbour's title. Kept gentle — these faces are read, not
// just looked at.
const FAN_TILT   = 6;    // degrees
const FAN_SPREAD = 44;   // px, outward
const FAN_GAP    = 36;   // px between cards while fanned
const FAN_DROP   = 20;   // px, outer cards settle lower

/**
 * The pinned three-card sequence.
 *
 * Everything lives inside a gsap.context scoped to the section, so one
 * revert() on cleanup removes every tween, ScrollTrigger and matchMedia
 * this hook created — and only those. (The earlier standalone version of
 * this animation called ScrollTrigger.getAll().forEach(kill) on every
 * resize, which would take the hero and work-section triggers down with
 * it now that they share a page.)
 *
 * Scroll progress drives four beats: the heading fades up, the row narrows,
 * the cards separate, then they flip to their titles. The two threshold
 * beats are latched with booleans so crossing them fires exactly one tween
 * instead of restarting on every scroll frame.
 */
export function usePillars(enabled, sectionRef) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!enabled || !section) return;

    let mm;
    const ctx = gsap.context(() => {
      mm = gsap.matchMedia();

      mm.add(DESKTOP, () => {
        const stage = section.querySelector(".pillars__stage");
        const row = section.querySelector(".pillars__row");
        const heading = section.querySelector(".pillars__heading");
        const cards = gsap.utils.toArray(section.querySelectorAll(".pillar"));
        const outer = [cards[0], cards[cards.length - 1]].filter(Boolean);
        if (!stage || !row || !heading || cards.length < 3) return;

        let split = false;
        let flipped = false;
        let gap = 0;
        let width = null;

        const st = ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: () => "+=" + window.innerHeight * 4,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;

            // ── Heading: rise + fade across HEADER_IN ──────────
            if (p < HEADER_IN[0]) {
              gsap.set(heading, { y: 40, opacity: 0 });
            } else if (p <= HEADER_IN[1]) {
              const t = gsap.utils.mapRange(HEADER_IN[0], HEADER_IN[1], 0, 1, p);
              gsap.set(heading, { y: gsap.utils.mapRange(0, 1, 40, 0, t), opacity: t });
            } else {
              gsap.set(heading, { y: 0, opacity: 1 });
            }

            // ── Row width: scrubbed while narrowing, then stateful ──
            // Past NARROW_TO the width becomes a two-state tween (joined
            // vs fanned) rather than a per-frame set, so the flip can widen
            // the row without a gsap.set overwriting it every frame.
            if (p <= NARROW_TO) {
              gsap.set(row, {
                width: `${gsap.utils.mapRange(0, NARROW_TO, 75, WIDTH_JOINED, p)}%`,
              });
              width = null;
            } else {
              const targetWidth = p >= FLIP_AT ? WIDTH_FANNED : WIDTH_JOINED;
              if (targetWidth !== width) {
                width = targetWidth;
                gsap.to(row, { width: `${width}%`, duration: 0.6 });
              }
            }

            // ── One slab splits into three cards ───────────────
            if (p >= SPLIT_AT && !split) {
              split = true;
              gsap.to(cards, { borderRadius: "20px", duration: 0.5 });
            } else if (p < SPLIT_AT && split) {
              split = false;
              gsap.to(cards[0], { borderRadius: "20px 0 0 20px", duration: 0.5 });
              gsap.to(cards[1], { borderRadius: "0px", duration: 0.5 });
              gsap.to(cards[2], { borderRadius: "0 20px 20px 0", duration: 0.5 });
            }

            // ── Gap: one owner, three states ───────────────────
            // Derived rather than set inside the split/flip branches: a fast
            // scroll can cross both thresholds in a single update, and two
            // branches each tweening `gap` would leave whichever ran last
            // holding the wrong value.
            const targetGap = p >= FLIP_AT ? FAN_GAP : p >= SPLIT_AT ? 20 : 0;
            if (targetGap !== gap) {
              gap = targetGap;
              gsap.to(row, { gap: `${gap}px`, duration: 0.6 });
            }

            // ── Flip to reveal the live projects ───────────────
            // `is-flipped` hands pointer events to the back face. Without
            // it the hidden side can still swallow clicks in some engines,
            // so the artwork would eat taps meant for the project links.
            if (p >= FLIP_AT && !flipped) {
              flipped = true;
              cards.forEach((c) => c.classList.add("is-flipped"));
              gsap.to(cards, { rotationY: 180, duration: 0.75, stagger: 0.1 });
              // The fan swings each outer card's base sideways by roughly
              // height × sin(tilt) — enough to cover its neighbour's title
              // and links. Push the outer cards outward by more than that
              // swing (the row also widens above) so all three stay readable.
              gsap.to(outer, {
                y: FAN_DROP,
                x: (i) => [-FAN_SPREAD, FAN_SPREAD][i],
                rotationZ: (i) => [-FAN_TILT, FAN_TILT][i],
                duration: 0.75,
              });
            } else if (p < FLIP_AT && flipped) {
              flipped = false;
              cards.forEach((c) => c.classList.remove("is-flipped"));
              gsap.to(cards, { rotationY: 0, duration: 0.75, stagger: -0.1 });
              gsap.to(outer, { y: 0, x: 0, rotationZ: 0, duration: 0.75 });
            }
          },
        });

        // matchMedia cleanup: leaving the breakpoint unpins and clears every
        // inline style the sequence wrote, so the stacked layout starts fresh.
        return () => {
          st.kill();
          cards.forEach((c) => c.classList.remove("is-flipped"));
          gsap.set([row, heading, ...cards], { clearProps: "all" });
        };
      });
    }, section);

    // revert() the matchMedia explicitly as well as the context — belt and
    // braces, and idempotent if the context already took it down.
    return () => {
      mm?.revert();
      ctx.revert();
    };
  }, [enabled, sectionRef]);
}
