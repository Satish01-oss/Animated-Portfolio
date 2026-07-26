import { useEffect, useMemo, useRef, useState } from "react";

import Loader from "./components/Loader.jsx";
import Cursor from "./components/Cursor.jsx";
import ProgressRail from "./components/ProgressRail.jsx";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Skills from "./components/Skills.jsx";
import Work from "./components/Work.jsx";
import Education from "./components/Education.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";

import { useTheme } from "./hooks/useTheme.js";
import { useCursor } from "./hooks/useCursor.js";
import { useImageSequence } from "./hooks/useImageSequence.js";
import { useLenis } from "./hooks/useLenis.js";
import { useScrollAnimations } from "./hooks/useScrollAnimations.js";
import { useCharacterHover } from "./hooks/useCharacterHover.js";

export default function App() {
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const railRefs = useMemo(
    () => ({ fill: { current: null }, pct: { current: null }, label: { current: null } }),
    []
  );

  const { theme, toggle } = useTheme();
  const sequence = useImageSequence(canvasRef);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);   // priority frames decoded → lift loader + start motion
  const [showLoader, setShowLoader] = useState(true);

  // Custom cursor and character parallax are independent of load state.
  useCursor(cursorRef);
  useCharacterHover(canvasRef);

  // Kick off the priority preload once. StrictMode double-invokes effects in
  // dev, so guard against a second preload with a ref.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    sequence.preload(setProgress).then(() => setReady(true));
  }, [sequence]);

  // Fade the loader out, then unmount it after the CSS transition.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setShowLoader(false), 900);
    return () => clearTimeout(t);
  }, [ready]);

  // Smooth scroll + progress rail, and all scroll-driven animation, start
  // only after the loader lifts so every measurement sees a settled layout.
  useLenis(ready, railRefs);
  useScrollAnimations(ready, sequence);

  return (
    <>
      <Cursor ref={cursorRef} />
      {showLoader && <Loader progress={progress} done={ready} />}

      <ProgressRail fillRef={railRefs.fill} pctRef={railRefs.pct} labelRef={railRefs.label} />
      <Nav theme={theme} onToggleTheme={toggle} />

      <main id="main">
        <Hero ref={canvasRef} />
        <About />
        <Skills />
        <Work />
        <Education />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
