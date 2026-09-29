# 🎬 3D Animated Portfolio

A cinematic, scroll-driven personal portfolio that merges two earlier projects into
one site:

- **Animated** — the scroll-storytelling shell: canvas image-sequence hero, Lenis
  smooth scroll, custom cursor, progress rail, light/dark theme.
- **3D Portfoil** — the WebGL pieces: a bloom-lit rotating cylinder and a pinned
  three-card flip sequence.

Both are now sections of a single narrative, built to the rules in
[`Skill.md`](Skill.md).

---

## 🧭 The scroll story

| # | Section | Where it came from | What it does |
|---|---------|--------------------|--------------|
| — | **Hero** | Animated | 300-frame WebP sequence scrubbed by scroll; captions swap as the character moves |
| 01 | **About** | Animated | Split-line statement + meta grid |
| 02 | **Skills** | Animated | Hover a tool name to summon its official logo on a cursor-following tile |
| 03 | **Showreel** | **3D Portfoil** | Textured cylinder with a bloom pass; scroll turns it two full revolutions |
| 04 | **Selected work** | **both** | One photograph splits into three cards, which flip to become the project cards — screenshot, detail and links, with the Animated project's hover reveal |
| 05 | **Education** | Animated | — |
| 06 | **Contact** | Animated | Split-char heading, magnetic mail link |

---

## 🛠️ Built With

- React 19 + Vite 7
- GSAP + ScrollTrigger
- Lenis smooth scroll
- SplitType
- Three.js via @react-three/fiber, drei and postprocessing

---

## 📂 Project Structure

```
3D Animated Portfolio/
│
├── index.html                    # Vite entry, pre-paint theme resolution
├── src/
│   ├── main.jsx                  # mounts <App>, imports the stylesheets
│   ├── App.jsx                   # orchestrates load → reveal → animate
│   ├── components/
│   │   ├── Hero / About / Skills / Education / Contact / Footer
│   │   ├── Showreel.jsx          # WebGL section shell + poster fallback
│   │   ├── Pillars.jsx           # the work section: three-card flip deck
│   │   ├── three/Stage.jsx       # <Canvas> + bloom (lazy-loaded)
│   │   └── three/Cylinder.jsx    # the rotating mesh
│   ├── hooks/                    # useLenis, useImageSequence, useScrollAnimations,
│   │                             # useShowreel, usePillars, useCursor, useTheme, …
│   ├── data/                     # projects.js — one source for the work section
│   ├── styles/                   # global / hero / about / showreel /
│   │                             # pillars / contact
│   └── assets/images/            # project screenshots (bundled + fingerprinted)
│
├── public/assets/sequence/       # 300 WebP hero frames
├── public/assets/textures/       # showreel cylinder texture
├── public/assets/pillars/        # the three card artworks
├── scripts/convert-frames.mjs    # PNG → WebP
└── Skill.md                      # the spec this site is built to
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev        # http://localhost:5175 (any port works)
npm run build      # output in dist/
npm run preview    # serve the production build
```

---

## ⚡ Load strategy

The hero sequence is ~21 MB. Getting that off the critical path is most of the
work here — measured at a throttled 10 Mbps, first paint went from waiting on
**20.7 MB** to **2.97 MB**.

- **Frames load interlaced, not sequentially.** Pass 1 fetches every 12th frame
  (25 images, <2 MB) and that alone spans the whole timeline, so the hero is
  scrubbable end to end the moment the loader lifts. Passes at every 6th, 3rd
  and finally every frame refine it in the background. Gaps fall back to the
  nearest loaded frame, so an unrefined stretch is a lower frame rate, never a
  hole.
- **three.js (~950 kB) waits** until an IntersectionObserver says the Showreel
  is two viewports away.
- **The pillars panorama (~550 kB) waits** the same way. A CSS background
  cannot be lazy-loaded natively, so the image is attached by an `.is-armed`
  class rather than declared unconditionally.

Two bundling traps are worth knowing about, because both silently undo the
deferral above and neither is visible without inspecting the built output:

1. React must be named explicitly in `manualChunks`. Left implicit, Rollup
   treats it as shared between the entry and `@react-three/fiber` and folds it
   *into* the three chunk — which makes the entry statically import that chunk.
2. Vite's `__vitePreload` helper landed in the three chunk too. The entry
   importing that one symbol was enough to pull all 950 kB down on first paint.
   It is pinned to the `react` chunk for that reason.

If you re-add a dynamic import, check `dist/assets/index-*.js` for a static
`from"./three-*.js"` — if it is there, the chunk is not actually deferred.

---

## 🧩 Notes on the merge

Decisions worth knowing about, and why:

- **Animated is the architectural base.** It already follows `Skill.md` — modular
  CSS per section, animation logic separated into hooks, Lenis synced to
  ScrollTrigger. The 3D work was brought in as sections rather than the other way
  round.

- **Tailwind was dropped.** `Skill.md` allows HTML/CSS/JS plus GSAP, ScrollTrigger,
  Lenis, SplitType and Three.js, and says to avoid unnecessary frameworks. The
  Tailwind-classed markup from *3D Portfoil* was rewritten against the existing
  design tokens.

- **No mobile block.** *3D Portfoil* served a 404 screen below 1000px. `Skill.md`
  requires responsiveness and graceful degradation, so instead: the Showreel falls
  back to a static poster on narrow screens, under `prefers-reduced-motion`, and
  where WebGL is unavailable; the Pillars stack into a plain list below 1000px.
  React Router went with it — this is one page.

- **The neon palette was neutralised.** Cyan/pink/green accents and the red card
  back became the site's white / black / single-gray-accent palette.

- **Class collisions were resolved.** *3D Portfoil*'s cards used `.card`, which
  already means a project card in `projects.css`. They are now `.pillar`, and every
  rule is scoped under `.pillars` — the original stylesheet restyled bare
  `section`, `h1`, `p` and `img`, which would have re-written the whole site.

- **Two bugs were fixed on the way in.** The card sequence called
  `ScrollTrigger.getAll().forEach(kill)` on every resize, which on a shared page
  would have destroyed the hero and work triggers too; it is now scoped to a
  `gsap.context`. And its heading tween passed a 4-argument `gsap.utils.mapRange`,
  which returns a *function* rather than a number — the heading offset was never
  animating as intended.

- **Three.js is lazy and gated.** It is a separate chunk, imported only when the
  Showreel decides the device should get WebGL, and the render loop is switched to
  `frameloop="never"` by an IntersectionObserver whenever the section is off screen.

- **Not carried over:** the 70 MB of original PNG frames (the shipped WebP set is
  in `public/assets/sequence/`) and the `legacy/` static HTML version. To
  regenerate frames, point `scripts/convert-frames.mjs` at a folder of PNG
  originals.

---

## 🖼️ Image credits

The Pillars front is a **single** photograph by
[Benjamin Voros](https://unsplash.com/photos/mountain-under-starry-sky-phIFdC6lA4E)
on [Unsplash](https://unsplash.com), desaturated and cropped to 15:7 (three 5:7
cards side by side) via the Unsplash CDN. The
[Unsplash License](https://unsplash.com/license) permits free commercial use
without attribution; credited here anyway.

It is sliced in CSS, not in the image: each card paints the same file at
`background-size: 300% 100%` and offsets to its own third, so the slab reads as
one continuous picture until the cards separate.

To swap it, replace `src/assets/images/pillars-panorama.jpg` with another **15:7**
image — nothing else needs to change. A different aspect ratio will stretch the
slices.

The Showreel cylinder wears `public/assets/textures/showreel.webp`: six vivid
photographs (also Unsplash) composited into one strip with **transparent
gutters**, so the far wall of the open-ended cylinder shows through the gaps —
that is what makes the bloom read as light coming from behind the object.

Its aspect ratio is **6.283 : 1** — that is 2πr : h for a radius-1, height-1
cylinder, which is what stops the panels stretching around the curve. Keep that
ratio if you rebuild it. Sources are pushed to 1.28 saturation and held at 0.88
brightness: saturation up so the bloom carries colour instead of washing to
white, brightness back so only genuine highlights cross the 0.49 threshold and
the panels stay readable behind the glow.

Brand marks in the Contact section are inlined from
[simple-icons](https://simpleicons.org) (CC0) in `src/components/Icon.jsx` —
inlined rather than fetched, because a contact section that needs a CDN to
render its own links is one that breaks offline. The marks are the entire link:
no handles or URLs are printed, and each destination reaches assistive tech and
the browser status bar through `aria-label` / `<title>` and the `href`.

---

## 📬 Contact

- GitHub: https://github.com/Satish01-oss
- LinkedIn: https://www.linkedin.com/in/satish-kumar-ram-468a5b321/
- Email: ss7233563@gmail.com

---

## 📄 License

MIT.
