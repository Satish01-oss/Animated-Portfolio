import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// The choreography needs three cards side by side, so it is desktop-only;
// below this the CSS stacks the cards and nothing is pinned.
export const WORK_DESKTOP = "(min-width: 1000px) and (prefers-reduced-motion: no-preference)";

// Milestones, in viewport heights of scroll from the moment the section's top
// edge enters at the bottom of the screen (the stage pins at 1). One table so
// the whole sequence can be read — and retimed — at a glance.
const V = {
  COPY_IN:  [0.55, 1.1],   // "Three builds, in the round" arrives with the ring
  SPIN:     [0, 3.6],      // scroll turns the ring
  COPY_OUT: [3.2, 3.7],
  UNROLL:   [3.6, 5.4],    // ring stands up, opens, lands on the cards
  HANDOFF:  [5.2, 5.5],    // canvas → DOM cards
  HEADING:  [5.4, 5.85],   // "Turn them over"
  SPLIT:    6.0,           // slab separates into three cards
  FLIP:     6.55,          // cards turn to show the projects
};

// Card geometry. The cards are LAID OUT at their fanned, readable size, and
// the joined slab is that layout scaled down — so the text on the faces is
// rasterised at 1:1 when it is actually read, and no state ever animates
// width or gap (which would re-run layout on every frame).
const JOINED_SCALE = 0.8;
const SPLIT_GAP = 22;      // px between cards once separated (visual)
const FAN_TILT = 5;        // degrees
const FAN_SPREAD = 26;     // px, outer cards pushed out
const FAN_DROP = 18;       // px, outer cards settle lower
const RADIUS = 20;         // visual corner radius, px

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const span = ([a, b], v) => clamp01((v - a) / (b - a));

/**
 * The work chapter: a WebGL ring of the three projects that unrolls into a
 * strip, lands on three DOM cards, and hands over to them; the cards then
 * split and turn over to show each project.
 *
 * Returns refs the <Ring> reads every frame — `progress` ({ spin, unroll })
 * and `target` (where the flat strip must land, px relative to the stage) —
 * plus `active`, which parks the render loop when the canvas is off screen
 * or has already handed over.
 */
export function useWork(enabled, sectionRef, has3D) {
  const progress = useRef({ spin: 0, unroll: 0 });
  const target = useRef(null);
  const [inView, setInView] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!enabled || !section) return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "20% 0px 20% 0px" }
    );
    io.observe(section);

    let mm;
    const ctx = gsap.context(() => {
      mm = gsap.matchMedia();

      mm.add(WORK_DESKTOP, () => {
        const sticky = section.querySelector(".work__sticky");
        const stage = section.querySelector(".work__stage");
        const copy = section.querySelector(".work__copy");
        const marquee = section.querySelector(".work__marquee");
        const deck = section.querySelector(".pillars__stage");
        const row = section.querySelector(".pillars__row");
        const heading = section.querySelector(".pillars__heading");
        const cards = gsap.utils.toArray(section.querySelectorAll(".pillar"));
        const labels = section.querySelectorAll(".pillar__label");
        if (!sticky || !deck || !row || cards.length !== 3) return;

        // ── Geometry ─────────────────────────────────────────────
        let w = 0, G = 0;
        const measure = () => {
          // Layout boxes via offset*, which ignore transforms — the cards are
          // transformed in every state, the layout underneath never is.
          w = cards[0].offsetWidth;
          const h = cards[0].offsetHeight;
          G = cards[1].offsetLeft - (cards[0].offsetLeft + w);
          let x = 0, y = 0;
          for (let el = row; el && el !== sticky; el = el.offsetParent) {
            x += el.offsetLeft;
            y += el.offsetTop;
          }
          const cx = x + row.offsetWidth / 2;
          const cy = y + row.offsetHeight / 2;
          const jw = 3 * JOINED_SCALE * w - 2;
          const jh = JOINED_SCALE * h;
          target.current = { x: cx - jw / 2, y: cy - jh / 2, w: jw, h: jh };
        };

        // Per-state transforms. x is measured from each card's own layout
        // slot, so it has to cancel the layout gap before adding its own.
        const r = RADIUS / JOINED_SCALE;     // CSS radius that LOOKS like 20px
        const states = {
          joined: (i) => ({
            x: (i - 1) * (JOINED_SCALE * w - 1 - (w + G)),
            y: 0, scale: JOINED_SCALE, rotationY: 0, rotationZ: 0,
            borderRadius: [`${r}px 0px 0px ${r}px`, "0px 0px 0px 0px", `0px ${r}px ${r}px 0px`][i],
          }),
          split: (i) => ({
            x: (i - 1) * (JOINED_SCALE * w + SPLIT_GAP - (w + G)),
            y: 0, scale: JOINED_SCALE, rotationY: 0, rotationZ: 0,
            borderRadius: `${r}px ${r}px ${r}px ${r}px`,
          }),
          fanned: (i) => ({
            x: (i - 1) * FAN_SPREAD,
            y: i === 1 ? 0 : FAN_DROP,
            scale: 1, rotationY: 180, rotationZ: (i - 1) * FAN_TILT,
            borderRadius: `${RADIUS}px ${RADIUS}px ${RADIUS}px ${RADIUS}px`,
          }),
        };

        // One owner for every card property: whatever the scroll crosses,
        // the cards tween to the state it lands in. A fast flick that skips
        // straight from joined to fanned still ends up coherent.
        let state = null;
        const go = (next, instant = false) => {
          if (next === state && !instant) return;
          const prev = state;
          state = next;
          cards.forEach((c) => c.classList.toggle("is-flipped", next === "fanned"));
          gsap.to(labels, {
            autoAlpha: next === "joined" ? 0 : 1,
            duration: instant ? 0 : 0.5,
            overwrite: true,
          });
          const turning = (next === "fanned") !== (prev === "fanned");
          cards.forEach((card, i) => {
            gsap.to(card, {
              ...states[next](i),
              duration: instant ? 0 : turning ? 0.9 : 0.6,
              delay: instant || !turning ? 0 : (next === "fanned" ? i : 2 - i) * 0.08,
              ease: "power3.inOut",
              overwrite: true,
            });
          });
        };

        const stateAt = (v) => (v >= V.FLIP ? "fanned" : v >= V.SPLIT ? "split" : "joined");

        gsap.set(cards, { transformOrigin: "50% 50%" });
        measure();
        go("joined", true);

        let wasLanded = false;
        const st = ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom bottom",
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            measure();
            go(stateAt(toVh(self)), true);
          },
          onUpdate: (self) => {
            const v = toVh(self);

            progress.current.spin = span(V.SPIN, v);
            progress.current.unroll = has3D ? span(V.UNROLL, v) : 0;

            const copyA = span(V.COPY_IN, v) * (1 - span(V.COPY_OUT, v));
            if (marquee) gsap.set(marquee, { autoAlpha: 1 - span(V.COPY_OUT, v) });
            gsap.set(copy, { autoAlpha: copyA, y: (1 - span(V.COPY_IN, v)) * 30 - span(V.COPY_OUT, v) * 30 });

            // Without WebGL there is no ring to hand over from: the deck just
            // fades up where the unroll would have been.
            const hand = has3D ? span(V.HANDOFF, v) : span(V.UNROLL, v);
            gsap.set(deck, { autoAlpha: hand });
            if (stage) gsap.set(stage, { autoAlpha: 1 - hand });

            const hd = span(V.HEADING, v);
            gsap.set(heading, { autoAlpha: hd, y: (1 - hd) * 40 });

            const isLanded = v > V.HANDOFF[1] + 0.05;
            if (isLanded !== wasLanded) {
              wasLanded = isLanded;
              setLanded(isLanded);
            }

            go(stateAt(v));
          },
        });

        function toVh(self) {
          return (self.progress * (self.end - self.start)) / window.innerHeight;
        }

        return () => {
          st.kill();
          cards.forEach((c) => c.classList.remove("is-flipped"));
          gsap.set([...cards, deck, heading, copy, marquee, stage, ...labels].filter(Boolean), { clearProps: "all" });
          target.current = null;
        };
      });
    }, section);

    return () => {
      io.disconnect();
      mm?.revert();
      ctx.revert();
    };
  }, [enabled, sectionRef, has3D]);

  return { progress, target, active: inView && !landed };
}
