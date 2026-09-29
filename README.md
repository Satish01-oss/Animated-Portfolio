# 🎬 3D Animated Portfolio

A cinematic, scroll-driven personal portfolio that merges two earlier projects into
one site:

- **Animated** — the scroll-storytelling shell: canvas image-sequence hero, Lenis
  smooth scroll, custom cursor, progress rail, light/dark theme.
- **3D Portfoil** — the WebGL pieces: a bloom-lit rotating cylinder and a pinned
  three-card flip sequence.

Both are now one continuous story, built to the rules in [`Skill.md`](Skill.md).

---

## 🧭 The scroll story

The page is designed as **one shot**, not a stack of sections. Every seam is a
hand-over — something from one chapter becomes the next — rather than a cut.
And it reads **as the CV**: every word about Satish comes from
`Satish_Kumar_CV.pdf`, kept in one module, [`src/data/cv.js`](src/data/cv.js).

| # | Chapter | What happens | How it hands over |
|---|---------|--------------|-------------------|
| — | **Intro** | 150-frame WebP character sequence scrubbed by scroll; captions swap as he moves | The shot closes into a **profile card**, and the pose the page *opened* on develops into its photo |
| 01 | **Profile** | The CV's profile resolves **word by word** beside the card; the CV's personal details underneath | **Skills slides up over it** like a sheet while the stage sinks and darkens |
| 02 | **Skills** | Every CV skill in a five-column table, the MERN core marked; hover a column to read it, a tool for its logo | **The lights go down** — the whole page fades to near-black |
| 03 | **Work** | A bloom-lit **ring of the three live projects**; the camera travels round it and the panel facing you resolves into colour | The ring stands up, **unrolls into a film strip** and lands exactly on three cards… |
| | | …the cards **split**, then **turn over** to show each project | **The lights come back up** |
| 04 | **Projects** | "Beyond the reel": the CV's other projects (04–07) as CV entries | — |
| 05 | **Education** | BCA, RIIT / Kazi Nazrul University, and the CV's relevant areas | — |
| 06 | **Contact** | "Let's build", the CV's career objective, and a card with the email (one-click copy), the networks and his local time | His **name, edge to edge**, rises into the footer |

**The profile card.** It keeps the *first impression* — the hero's opening
frame, marquee still running behind his head — not the sequence's last frame.
No frame near the end is close enough to the opening pose to cut or dissolve
between them cleanly (the best pair still ghosts), so the photo empties as
the card closes and the opening frame *develops* into it, over-exposed first
and then settling, the way a print comes up. The card itself is paper that
`useIntro` grows round the photo's on-screen rectangle: a margin, a shadow,
and a name plate with the CV's headline.

Three things run through the whole page and tie it together:

- **The 5:7 frame.** The profile card's photo, every panel on the ring, and
  the cards are the same shape — the ring's strip and the card fronts are
  literally the same image (`work-strip.webp`).
- **The lights.** One CSS number, `--dim`, scrubbed by scroll, takes the page
  from paper to night and back, so there is never a hard-edged colour band.
- **Type behind the subject.** The outlined marquee runs behind the character
  in the hero and behind the ring in Work.
- **A still ending.** After the pinned set pieces, Contact and the footer are
  plain type — nothing repaints on scroll there. (An earlier version brought
  the character back in a second canvas; repainting 1920×1080 frames into it
  on every scroll step cost dropped frames, so it was taken out.)

---

## 🛠️ Built With

- React 19 + Vite 7
- GSAP + ScrollTrigger
- Lenis smooth scroll
- SplitType
- Three.js via @react-three/fiber and @react-three/postprocessing
- Type: **Geist** (everything read), **Geist Mono** (labels, numbers, tags)
  and **Instrument Serif** italic (accent words only) — self-hosted, OFL-1.1

---

## 📂 Project Structure

```
3D Animated Portfolio/
│
├── index.html                    # boot screen, preloads, @font-face, theme
├── vercel.json                   # long-lived caching for assets and fonts
├── src/
│   ├── main.jsx                  # mounts <App>, imports the stylesheets
│   ├── App.jsx                   # orchestrates load → hand-over → animate
│   ├── components/
│   │   ├── Hero.jsx              # the opening shot + profile card; Profile lives inside it
│   │   ├── About / Skills / Education / Footer
│   │   ├── Projects.jsx          # 04: the rest of the CV's projects
│   │   ├── Work.jsx              # 03: ring stage + the card deck it lands on
│   │   ├── Contact.jsx           # the sign-off: objective + contact card
│   │   ├── three/Stage.jsx       # <Canvas> + bloom (lazy-loaded)
│   │   └── three/Ring.jsx        # the ring: spin → unroll → land (shader)
│   ├── hooks/
│   │   ├── useIntro.js           # sequence → profile card → Profile → cover
│   │   ├── useWork.js            # ring progress, hand-over, split + flip
│   │   ├── useScrollAnimations.js# the lights, drawn rules, reveals, magnetics
│   │   └── useLenis, useImageSequence, useCursor, useTheme, …
│   ├── data/
│   │   ├── cv.js                 # every word about Satish, from the CV
│   │   └── projects.js           # the three ring projects (screenshots, links)
│   ├── styles/                   # global / hero / about / work / projects / contact
│   └── assets/images/            # screenshots + work-strip.webp (fingerprinted)
│
├── public/assets/sequence/       # 150 WebP hero frames (~7.5 MB)
├── public/fonts/                 # Geist, Geist Mono, Instrument Serif + licences
├── scripts/convert-frames.mjs    # PNG renders → the WebP sequence
├── scripts/build-work-strip.mjs  # screenshots → the ring / card-front strip
└── Skill.md                      # the spec this site is built to
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev        # http://localhost:5173 (any port works)
npm run build      # output in dist/
npm run preview    # serve the production build

npm run frames -- <folder-of-png-renders>   # rebuild the hero sequence
npm run strip                               # rebuild the work strip
```

---

## ⚡ Load strategy

The first screen needs exactly two things: the hero's **opening frame** and
the **fonts**. Everything else streams in behind a page that already works.

Measured on the production build over a throttled **5 Mbps** line:

| | before | after |
|---|---|---|
| Something on screen | 0.61 s | 0.50 s |
| Page ready to use | 4.73 s | **1.36 s** |
| Downloaded before it is usable | 2.57 MB | **0.28 MB** |
| Whole hero sequence | 22 MB | **7.5 MB** |

- **A boot screen ships in the HTML.** The name and a moving line paint with
  the first bytes, before any JavaScript arrives, and lift after 0.45 s as
  soon as the page is ready. A 2.5 s cap means a slow asset can never hold
  the page.
- **Preloaded, not discovered.** `index.html` requests the opening frame and
  the three fonts itself, so they download alongside the JS instead of after
  it. The fonts are self-hosted (74 KB for all three) — no third-party
  connection to open.
- **The sequence is lighter.** 150 frames instead of 300 (still one per ~2vh
  of scroll), re-encoded from the lossless renders at a setting that is
  indistinguishable at 100% zoom: ~51 KB a frame, down from ~77 KB.
- **Frames load interlaced, not sequentially.** After the opening frame, each
  pass spans the whole timeline at a finer step (every 8th, 4th, 2nd, then
  all), so the hero is scrubbable end to end early and only gets smoother.
  Gaps fall back to the nearest loaded frame — a lower frame rate, never a
  hole. Phones stop at 75 frames; Save-Data and 2G/3G connections at 38.
- **Logos wait for their section.** The Skills hover marks come from two CDNs;
  they are fetched when the section is a screen away, not at start-up.
- **three.js (~950 kB) waits** until an IntersectionObserver says the Work
  chapter is two viewports away.
- **The work strip (~120 kB) waits** the same way. A CSS background cannot be
  lazy-loaded natively, so the card fronts get it from an `.is-armed` class
  rather than unconditionally. The ring imports the same fingerprinted file,
  so one download serves both.
- **Nothing scroll-driven renders React.** Scroll writes into refs the ring
  reads in `useFrame`; the render loop is parked (`frameloop="never"`) when the
  chapter is off screen *and* once the ring has handed over to the DOM cards.

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
  requires responsiveness and graceful degradation, so instead: below 1000px,
  under `prefers-reduced-motion`, or without WebGL, the ring is skipped and the
  cards stack into a plain list. On narrow screens the character dims behind the
  Profile text instead of framing into a portrait. React Router went with
  it — this is one page.

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
  Work chapter decides the device should get WebGL, and the render loop is
  switched to `frameloop="never"` whenever the canvas has nothing to show.

- **How the ring lands on the cards.** The ring's shader unrolls it by growing
  the bend radius while arc length stays fixed, so the panels never stretch.
  `useWork` measures the cards' joined rectangle (from `offset*`, which ignores
  transforms), and `Ring.jsx` converts that from pixels to world units for the
  fixed landing camera. The strip is placed on exactly that rectangle before
  the canvas fades out and the DOM cards fade in. The cards are laid out at
  their fanned, readable size; the joined slab is that layout scaled down, so
  card text is rasterised 1:1 when it is read and no state animates layout.

- **Two r3f traps, both silent.** `<shaderMaterial uniforms={…}>` hands the
  material a *copy* of the uniforms, so per-frame writes never reach the GPU —
  the ring builds its own `ShaderMaterial` instead. And the postprocessing
  effects memoise on `JSON.stringify(props)`; in React 19 `ref` is a prop, so an
  object ref on `<Bloom>` throws on the circular effect inside it. It uses a
  callback ref, which stringify skips.

- **Not carried over:** the 70 MB of original PNG renders (they remain in the
  repo's git history under `assets/sequence/`) and the `legacy/` static HTML
  version. To rebuild the WebP sequence, run `npm run frames -- <folder>` on
  a folder of those PNGs.

---

## 🖼️ Image credits

All imagery on the ring and the cards is the portfolio's own work: the three
project screenshots in `src/assets/images/`.

`work-strip.webp` is those three screenshots cropped to 5:7 portraits and laid
side by side (15:7 overall) by `scripts/build-work-strip.mjs`. The ring samples
it as its texture — six panels, the three projects twice round — and each card
front paints the same file at `background-size: 300% 100%`, offset to its own
third. Because both read the same pixels, the moment the unrolled ring hands
over to the real cards is the same picture in the same place.

To change what the ring shows, edit the crop offsets in the script and re-run
`node scripts/build-work-strip.mjs`. Keep each panel 5:7; the ring's radius is
derived from that ratio.

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
