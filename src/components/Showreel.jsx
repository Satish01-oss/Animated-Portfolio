import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useShowreel } from "../hooks/useShowreel.js";

// three + fiber + postprocessing is the heaviest thing on the page and only
// this section needs it, so it is code-split. On the devices that fall back
// to the poster it is never fetched at all.
const Stage = lazy(() => import("./three/Stage.jsx"));

const POSTER = `${import.meta.env.BASE_URL}assets/textures/showreel.webp`;

/**
 * Decide once, at mount, whether this device should get WebGL.
 *
 * Narrow screens and reduced-motion visitors get a static poster instead:
 * a post-processed 3D scene is the single most expensive thing here, and
 * "degrade gracefully" beats "ship a slideshow at 12fps".
 */
function canRender3D() {
  if (typeof window === "undefined") return false;
  if (!window.matchMedia("(min-width: 861px)").matches) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const probe = document.createElement("canvas");
    return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Showreel({ ready }) {
  const sectionRef = useRef(null);
  const [use3D] = useState(canRender3D);
  const [nearby, setNearby] = useState(false);
  const { progress, active } = useShowreel(ready && use3D, sectionRef);

  /**
   * Hold the three.js import until the visitor is heading this way.
   *
   * Lazy-importing <Stage> at mount still fetches the whole ~1.1 MB three
   * chunk during initial load, where it competes with the hero frames for
   * bandwidth and delays the one thing the visitor is actually waiting for.
   * Two viewports of lead time is far more than the chunk needs to arrive.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!use3D || !section || nearby) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNearby(true);
        io.disconnect();
      },
      { rootMargin: "200% 0px" }
    );
    io.observe(section);
    return () => io.disconnect();
  }, [use3D, nearby]);

  return (
    <section className="showreel" id="showreel" data-section="Showreel" ref={sectionRef}>
      <div className="showreel__sticky">
        <div className="showreel__stage">
          {use3D ? (
            nearby && (
              <Suspense fallback={null}>
                <Stage progress={progress} active={active} />
              </Suspense>
            )
          ) : (
            <img className="showreel__poster" src={POSTER} alt="" aria-hidden="true" />
          )}
        </div>

        <div className="showreel__marquee" aria-hidden="true">
          <div className="showreel__marquee-track">
            <span>Creativity in motion</span>
            <span>React · Three.js · GSAP</span>
            <span>Interactive by default</span>
            <span>Creativity in motion</span>
            <span>React · Three.js · GSAP</span>
            <span>Interactive by default</span>
          </div>
        </div>

        <div className="showreel__copy">
          <p className="section__index">03 — In the round</p>
          <h2 className="section__title">Built to be<br /><em>turned over</em>.</h2>
          <p className="showreel__lede">
            The same care I give an API route goes into the surface on top of it.
            Scroll to turn it.
          </p>
        </div>
      </div>
    </section>
  );
}
