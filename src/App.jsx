import { useEffect, useMemo, useRef, useState } from "react";

import Cursor from "./components/Cursor.jsx";
import ProgressRail from "./components/ProgressRail.jsx";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Skills from "./components/Skills.jsx";
import Work from "./components/Work.jsx";
import Projects from "./components/Projects.jsx";
import Education from "./components/Education.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";

import { useTheme } from "./hooks/useTheme.js";
import { useCursor } from "./hooks/useCursor.js";
import { useImageSequence } from "./hooks/useImageSequence.js";
import { useLenis } from "./hooks/useLenis.js";
import { useIntro } from "./hooks/useIntro.js";
import { useScrollAnimations } from "./hooks/useScrollAnimations.js";
import { useCharacterHover } from "./hooks/useCharacterHover.js";

// However slow the network, the page is handed over by this point; whatever
// has not arrived streams in behind a page that already works.
const MAX_WAIT = 2500;

export default function App() {
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const railRefs = useMemo(
    () => ({ fill: { current: null }, pct: { current: null }, label: { current: null } }),
    []
  );

  const { theme, toggle } = useTheme();
  const sequence = useImageSequence(canvasRef);
  const [ready, setReady] = useState(false);

  // Custom cursor and character parallax are independent of load state.
  useCursor(cursorRef);
  useCharacterHover(canvasRef);

  // The first screen needs two things: the hero's opening frame and the
  // fonts — about 140 KB, both preloaded by index.html. The rest of the
  // sequence loads in interlaced passes behind the visitor (see
  // useImageSequence). A ref guards against starting the pool twice.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const cap = new Promise((resolve) => setTimeout(resolve, MAX_WAIT));
    Promise.race([Promise.all([sequence.preload(), fonts]), cap]).then(() => setReady(true));
  }, [sequence]);

  // Lift the boot screen index.html painted, then drop it from the DOM.
  useEffect(() => {
    if (!ready) return;
    const boot = document.getElementById("boot");
    if (!boot) return;
    boot.classList.add("is-done");
    const t = setTimeout(() => boot.remove(), 500);
    return () => clearTimeout(t);
  }, [ready]);

  // Smooth scroll + progress rail, and all scroll-driven animation, start
  // once the page is handed over, so every measurement sees a settled layout.
  // The opening shot (useIntro) and the Work chapter (<Work>) take the same
  // flag; child effects run before the parent's and useIntro is declared
  // before useScrollAnimations, so its final ScrollTrigger.refresh() covers
  // every trigger on the page.
  useLenis(ready, railRefs);
  useIntro(ready, sequence);
  useScrollAnimations(ready);

  return (
    <>
      <Cursor ref={cursorRef} />

      <ProgressRail fillRef={railRefs.fill} pctRef={railRefs.pct} labelRef={railRefs.label} />
      <Nav theme={theme} onToggleTheme={toggle} />

      <main id="main">
        <Hero ref={canvasRef} />
        <Skills />
        <Work ready={ready} />
        <Projects />
        <Education />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
