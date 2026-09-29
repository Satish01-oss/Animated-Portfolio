import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const REDUCE = "(prefers-reduced-motion: reduce)";
const WIDE = "(min-width: 861px)";

// Milestones as fractions of the STORY: the hero's pinned scroll up to the
// moment Skills starts sliding over it. One table, so the whole opening can
// be read — and retimed — at a glance.
const P = {
  FRAMES:   [0, 0.6],      // the character sequence plays through
  CAPTIONS: 0.58,          // the last caption leaves as it ends
  FRAME:    [0.6, 0.8],    // the shot closes into the profile card
  LEAVE:    [0.6, 0.655],  // the last pose fades off the photo…
  DEVELOP:  [0.655, 0.8],  // …and the OPENING pose develops into it
  ABOUT_IN: [0.68, 0.74],  // the Profile block fades up beside it
  INDEX:    [0.7, 0.76],   // "01 — Profile"
  WORDS:    [0.72, 0.94],  // the statement resolves word by word
  META:     [0.9, 0.99],   // the facts underneath
};

// The card keeps the FIRST impression — the pose the page opens on — not
// the sequence's last frame. No frame near the end is close enough to the
// opening to cut or dissolve between them cleanly (the nearest pair still
// ghosts), so the photo empties and the opening frame develops into it,
// the way a print comes up: over-exposed first, then settling.
const OPENING = 0;

// The profile card, in viewport heights. The photo is 5:7 — the shape the
// Work cards use later — on a paper card with the name plate beneath it.
const PHOTO_H = 0.62;
const MARGIN = 0.014;      // paper round the photo
const PLATE_H = 0.095;     // the name plate
const PHOTO_R = 12;        // px on screen
const CARD_R = 20;         // px on screen, the Work cards' radius
// Which part of the (unscaled) stage the photo shows: from a little above
// the top — paper headroom over the hair — to the foot of the frame, so the
// card holds the whole bust exactly as the opening screen does.
const WIN_TOP = -0.07;
const WIN_BOTTOM = 0.99;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const span = ([a, b], v) => clamp01((v - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * The opening chapter, as one pinned shot:
 *
 *   1. scroll scrubs the 300-frame character sequence; captions swap;
 *   2. the shot closes into a profile card on the right, and the pose the
 *      page OPENED on — the first impression — develops into its photo: the
 *      opening frame in miniature, marquee still running behind his head,
 *      on paper with his name and headline underneath;
 *   3. the Profile resolves beside it, word by word, as the visitor scrolls;
 *   4. Skills slides up over the stage like a sheet while it sinks back.
 *
 * Narrow screens skip the card (there is no room beside the text): he dims
 * behind the statement instead. Reduced motion gets a still frame and the
 * Profile as an ordinary section.
 */
export function useIntro(enabled, sequence) {
  useEffect(() => {
    if (!enabled) return;

    const hero = document.querySelector(".hero");
    const statement = document.querySelector(".about__statement");
    if (!hero) return;

    let split = null;
    let mm;
    const ctx = gsap.context(() => {
      mm = gsap.matchMedia();

      mm.add({ motion: MOTION_OK, reduce: REDUCE, wide: WIDE }, (context) => {
        if (context.conditions.reduce) {
          sequence.setFrame(0);
          return undefined;
        }
        const wide = context.conditions.wide;

        const sticky = hero.querySelector(".hero__sticky");
        const media = hero.querySelector(".hero__media");
        const canvas = hero.querySelector(".hero__canvas");
        const frame = hero.querySelector(".hero__frame");
        const plate = hero.querySelector(".hero__plate");
        const shade = hero.querySelector(".hero__shade");
        const hint = hero.querySelector(".hero__scroll-hint");
        const about = hero.querySelector(".about");
        const index = about?.querySelector(".section__index");
        const metas = gsap.utils.toArray(hero.querySelectorAll(".about__meta-item"));
        const captions = gsap.utils.toArray(hero.querySelectorAll(".hero__caption"));

        split = statement ? new SplitType(statement, { types: "words" }) : null;
        const words = split?.words ?? [];
        const wordOpacity = new Float32Array(words.length).fill(-1);

        gsap.set(media, { transformOrigin: "0 0" });

        // ── Card geometry (px), refreshed with every layout change ──
        // Target state only; render() interpolates from the full stage.
        let geo = null;
        const measure = () => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const pad = about ? parseFloat(getComputedStyle(about).left) || 0 : 0;

          const ph = vh * PHOTO_H;
          const pw = (ph * 5) / 7;
          const m = clamp(vh * MARGIN, 10, 16);
          const plateH = clamp(vh * PLATE_H, 64, 96);
          const cardW = pw + 2 * m;
          const cardH = ph + m + plateH;
          const cardX = vw - pad - cardW;
          const cardY = (vh - cardH) / 2;

          // The photo's window in the stage's own (unscaled) coordinates,
          // centred on the character, who stands in the middle of every frame.
          const wy = vh * WIN_TOP;
          const wh = vh * (WIN_BOTTOM - WIN_TOP);
          const ww = (wh * 5) / 7;
          const wx = vw / 2 - ww / 2;
          const s = ph / wh;

          geo = {
            vw, vh, m, plateH, s,
            win: { x: wx, y: wy, w: ww, h: wh },
            tx: cardX + m - wx * s,           // lands the window on the photo
            ty: cardY + m - wy * s,
          };
          // The Profile text takes whatever the card leaves; the plate lines up
          // with the photo's margin.
          about?.style.setProperty("--card-w", `${cardW}px`);
          frame?.style.setProperty("--m", `${m}px`);
          frame?.style.setProperty("--plate-h", `${plateH}px`);
        };

        let activeCaption = -1;
        const setCaption = (i) => {
          if (i === activeCaption) return;
          activeCaption = i;
          captions.forEach((el, n) => el.classList.toggle("is-active", n === i));
        };

        // The canvas alone fades — the photo's paper and the marquee behind
        // him stay put, so the card never goes blank, only unpeopled.
        const renderCharacter = (p) => {
          const last = sequence.frameCount - 1;
          if (p < P.LEAVE[1]) {
            sequence.setFrame(span(P.FRAMES, p) * last);
            canvas.style.opacity = String(1 - ease(span(P.LEAVE, p)));
            canvas.style.filter = "";
          } else {
            sequence.setFrame(OPENING);
            const d = ease(span(P.DEVELOP, p));
            canvas.style.opacity = String(d);
            canvas.style.filter = d < 1 ? `brightness(${(1 + 0.7 * (1 - d)).toFixed(3)})` : "";
          }
        };

        const renderCard = (t) => {
          const g = geo;
          if (!g) return;
          // The window closes in the stage's coordinates while the stage
          // scales and slides; both from the same t, so they stay locked.
          const x = lerp(0, g.win.x, t);
          const y = lerp(0, g.win.y, t);
          const w = lerp(g.vw, g.win.w, t);
          const h = lerp(g.vh, g.win.h, t);
          const sc = lerp(1, g.s, t);
          const tx = lerp(0, g.tx, t);
          const ty = lerp(0, g.ty, t);

          const r = (PHOTO_R * t) / sc;
          media.style.clipPath =
            `inset(${y}px ${g.vw - x - w}px ${g.vh - y - h}px ${x}px round ${r}px)`;
          gsap.set(media, { x: tx, y: ty, scale: sc, opacity: 1 });

          // The paper grows round the photo's on-screen rect: margin on three
          // sides, the name plate below.
          if (frame) {
            const X = tx + x * sc, Y = ty + y * sc, W = w * sc, H = h * sc;
            const mm_ = g.m * t;
            frame.style.left = `${X - mm_}px`;
            frame.style.top = `${Y - mm_}px`;
            frame.style.width = `${W + 2 * mm_}px`;
            frame.style.height = `${H + mm_ + g.plateH * t}px`;
            frame.style.borderRadius = `${CARD_R * t}px`;
            frame.style.opacity = String(ease(span([0.25, 0.7], t)));
            if (plate) plate.style.opacity = String(span([0.72, 1], t));
          }
        };

        const render = (p) => {
          // 1 — the sequence, its captions, and the way back to the start
          renderCharacter(p);
          const c = Math.min(captions.length - 1, Math.floor(span([0, P.CAPTIONS], p) * captions.length));
          setCaption(p >= P.CAPTIONS ? -1 : c);
          if (hint) hint.style.opacity = String(1 - span([0, 0.04], p));

          // 2 — the shot closes into the card
          const t = ease(span(P.FRAME, p));
          if (wide) {
            renderCard(t);
          } else {
            media.style.clipPath = "";
            gsap.set(media, { x: 0, y: 0, scale: 1, opacity: 1 - 0.88 * t });
          }

          // 3 — the Profile. The block stays out of the sequence entirely:
          // its faint, unresolved words would otherwise sit over the captions.
          if (about) about.style.opacity = String(span(P.ABOUT_IN, p));
          if (index) index.style.opacity = String(span(P.INDEX, p));
          const wv = span(P.WORDS, p);
          const n = words.length;
          const SOFT = 4;                         // words in the moving edge
          for (let i = 0; i < n; i++) {
            const o = 0.14 + 0.86 * clamp01((wv * (n + SOFT) - i) / SOFT);
            if (Math.abs(o - wordOpacity[i]) > 0.005) {
              wordOpacity[i] = o;
              words[i].style.opacity = o.toFixed(3);
            }
          }
          const mt = span(P.META, p);
          metas.forEach((el, j) => {
            const o = clamp01((mt * (metas.length + 1.5) - j) / 1.5);
            el.style.opacity = String(o);
            el.style.transform = `translateY(${(1 - o) * 16}px)`;
          });
        };

        // The story ends where Skills starts covering the stage — which is
        // exactly one viewport before the stage unpins.
        const story = ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          end: () => "+=" + Math.max(1, hero.offsetHeight - 2 * window.innerHeight),
          invalidateOnRefresh: true,
          onRefresh: (self) => { measure(); render(self.progress); },
          onUpdate: (self) => render(self.progress),
        });

        // 4 — Skills slides up over the stage; the stage sinks and darkens.
        const skills = document.querySelector(".skills");
        const cover = skills && ScrollTrigger.create({
          trigger: skills,
          start: "top bottom",
          end: "top top",
          onUpdate: (self) => {
            const c = self.progress;
            gsap.set(sticky, { scale: 1 - 0.06 * c });
            if (shade) shade.style.opacity = String(0.45 * c);
          },
        });

        measure();
        render(story.progress);

        return () => {
          story.kill();
          cover?.kill();
          split?.revert();
          split = null;
          media.style.clipPath = "";
          canvas.style.opacity = "";
          canvas.style.filter = "";
          if (frame) frame.removeAttribute("style");
          if (plate) plate.style.opacity = "";
          if (shade) shade.style.opacity = "";
          if (hint) hint.style.opacity = "";
          if (index) index.style.opacity = "";
          if (about) { about.style.opacity = ""; about.style.removeProperty("--card-w"); }
          metas.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; });
          gsap.set([media, sticky], { clearProps: "transform,opacity" });
          captions.forEach((el, n) => el.classList.toggle("is-active", n === 0));
        };
      });
    });

    return () => {
      mm?.revert();
      ctx.revert();
      split?.revert();
    };
  }, [enabled, sequence]);
}
