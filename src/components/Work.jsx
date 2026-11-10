import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { projects } from "../data/projects.js";
import { useWork, WORK_DESKTOP } from "../hooks/useWork.js";

// three + fiber + postprocessing is the heaviest thing on the page and only
// this section needs it, so it is code-split. Devices that never get the
// ring never fetch it at all.
const Stage = lazy(() => import("./three/Stage.jsx"));

// A failed optional scene must not take the portfolio or project links down.
class StageBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function canRender3D() {
  let context;
  try {
    // Three r163+ requires WebGL2; WebGL1-only devices use the DOM deck.
    context = document.createElement("canvas").getContext("webgl2");
    return !!context;
  } catch {
    return false;
  } finally {
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/**
 * 03 — Work. One chapter, one continuous object:
 *
 *   ring of the three projects → unrolls into a strip → the strip lands on
 *   three cards → the cards split → the cards turn over to show each project.
 *
 * The card fronts paint the same image the ring wears (work-strip.webp), so the
 * hand-over from canvas to DOM is the same picture in the same place.
 */
export default function Work({ ready }) {
  const sectionRef = useRef(null);
  const [eligible, setEligible] = useState(false);
  const [failed, setFailed] = useState(false);
  const support = useRef(null);
  const onFailure = useCallback(() => setFailed(true), []);
  const use3D = eligible && !failed;

  useEffect(() => {
    const media = window.matchMedia(WORK_DESKTOP);
    const update = () => {
      if (media.matches && support.current === null) support.current = canRender3D();
      setEligible(media.matches && support.current === true);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [nearby, setNearby] = useState(false);
  const { progress, target, active } = useWork(ready, sectionRef, use3D);

  /**
   * Hold the three.js import — and the strip image the cards paint — until
   * the visitor is heading this way, so neither competes with the hero
   * frames during first load.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || nearby) return;
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
  }, [nearby]);

  return (
    <section
      className={`work${nearby ? " is-armed" : ""}${use3D ? " has-3d" : ""}`}
      id="work"
      data-section="Work"
      ref={sectionRef}
    >
      <div className="work__sticky">
        {use3D && (
          <div className="work__stage" aria-hidden="true">
            {nearby && (
              <StageBoundary onFailure={onFailure}>
                <Suspense fallback={null}>
                  <Stage progress={progress} target={target} active={active && use3D} onFailure={onFailure} />
                </Suspense>
              </StageBoundary>
            )}
          </div>
        )}

        <div className="work__marquee" aria-hidden="true">
          <div className="work__marquee-track">
            {[0, 1].map((n) => (
              <span key={n}>Design Library — O2 Fitness Gym — Powerlifting Portfolio —&nbsp;</span>
            ))}
          </div>
        </div>

        <div className="work__copy">
          <p className="section__index">03 — Selected work</p>
          <h2 className="section__title">Three builds,<br /><em>in the round</em>.</h2>
          <p className="work__lede">
            Each one taken from schema to surface.
            {/* Only true where the choreography runs; see work.css. */}
            <span className="work__cue"> Keep scrolling — the reel unrolls and deals them out.</span>
          </p>
        </div>

        <div className="pillars__stage">
          <div className="pillars__header">
            <h3 className="pillars__heading">Turn them over</h3>
          </div>

          <div className="pillars__row">
            {projects.map((p) => (
              <div className="pillar" id={p.id} key={p.no}>
                {/* The front is a slice of the strip the ring wears; see
                    work.css. The label only appears once the cards split. */}
                <div className="pillar__front">
                  <span className="pillar__label">
                    <span>{p.no}</span>
                    <span>{p.name}</span>
                  </span>
                </div>

                <div className="pillar__back">
                  <a
                    className={`pillar__shot${p.image ? "" : " pillar__shot--text"}`}
                    href={p.live}
                    target="_blank"
                    rel="noopener"
                    data-cursor="Visit"
                  >
                    {p.image ? <img
                      src={p.image}
                      width="1440"
                      height="900"
                      loading="lazy"
                      decoding="async"
                      alt={p.alt}
                    /> : <span>{p.name}</span>}
                  </a>

                  <div className="pillar__info">
                    <div className="pillar__head">
                      <span className="pillar__no">{p.no}</span>
                      <span className="pillar__tag">{p.tag}</span>
                    </div>

                    <h4 className="pillar__title">{p.title}</h4>

                    <ul className="pillar__points">
                      {p.points.map((pt) => <li key={pt}>{pt}</li>)}
                    </ul>

                    <div className="pillar__links">
                      {p.repo && <a className="magnetic" href={p.repo} target="_blank" rel="noopener" data-cursor="Code">Repository</a>}
                      <a className="magnetic" href={p.live} target="_blank" rel="noopener" data-cursor="Visit">Live demo</a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
