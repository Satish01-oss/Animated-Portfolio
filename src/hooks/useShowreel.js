import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Drives the WebGL showreel section.
 *
 * Two jobs, both about doing as little work as possible:
 *
 *  • scroll → rotation. The progress is written into a ref, never into
 *    state, so scrubbing the section costs zero React renders. <Cylinder>
 *    reads that ref inside useFrame.
 *
 *  • render gating. A WebGL canvas left on `frameloop="always"` keeps
 *    burning GPU frames while it sits three screens off-viewport. An
 *    IntersectionObserver flips `active`, and the caller passes that
 *    straight to <Canvas frameloop>, so the loop is genuinely stopped —
 *    not merely invisible — whenever the section is off screen.
 *
 * Runs only once `enabled` (the loader has lifted), matching every other
 * scroll behaviour on the page so triggers measure a settled layout.
 */
export function useShowreel(enabled, sectionRef) {
  const progress = useRef(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!enabled || !section) return;

    // Margin so the first frames render just before the section slides in,
    // and the loop keeps running just past it — no visible cold start.
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "20% 0px 20% 0px" }
    );
    io.observe(section);

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => { progress.current = self.progress; },
    });

    return () => {
      io.disconnect();
      st.kill();
    };
  }, [enabled, sectionRef]);

  return { progress, active };
}
