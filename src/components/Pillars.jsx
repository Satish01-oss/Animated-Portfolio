import { useEffect, useRef, useState } from "react";
import { projects } from "../data/projects.js";
import { usePillars } from "../hooks/usePillars.js";

/**
 * The work section. Fronts are three slices of one photograph; turning them
 * over reveals the project each slice was hiding.
 */
export default function Pillars({ ready }) {
  const sectionRef = useRef(null);
  const [armed, setArmed] = useState(false);
  usePillars(ready, sectionRef);

  /**
   * Attach the panorama only once the visitor is heading this way. It is a
   * CSS background, which browsers cannot lazy-load, so without this the
   * half-megabyte downloads on first paint and steals bandwidth from the
   * hero frames — for artwork that is four screens below the fold.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || armed) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setArmed(true);
        io.disconnect();
      },
      { rootMargin: "200% 0px" }
    );
    io.observe(section);
    return () => io.disconnect();
  }, [armed]);

  return (
    <section
      className={`pillars${armed ? " is-armed" : ""}`}
      id="work"
      data-section="Work"
      ref={sectionRef}
    >
      <div className="pillars__intro">
        <p className="section__index">04 — Selected work</p>
        <h2 className="pillars__statement" data-split-lines>
          Every idea begins as a single image.
        </h2>
      </div>

      <div className="pillars__stage">
        <div className="pillars__header">
          <h3 className="pillars__heading">Turn them over</h3>
        </div>

        <div className="pillars__row">
          {projects.map((p) => (
            <div className="pillar" id={p.id} key={p.no}>
              {/* The artwork is a background so one photograph can be
                  positioned across all three cards; see pillars.css. */}
              <div className="pillar__front" />

              <div className="pillar__back">
                <a
                  className="pillar__shot"
                  href={p.live}
                  target="_blank"
                  rel="noopener"
                  data-cursor="Visit"
                >
                  <img
                    src={p.image}
                    width="1440"
                    height="900"
                    loading="lazy"
                    decoding="async"
                    alt={p.alt}
                  />
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
                    <a className="magnetic" href={p.repo} target="_blank" rel="noopener" data-cursor="Code">Repository</a>
                    <a className="magnetic" href={p.live} target="_blank" rel="noopener" data-cursor="Visit">Live demo</a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pillars__outro">
        <h2 className="pillars__statement" data-split-lines>
          Every transition leaves a trace.
        </h2>
      </div>
    </section>
  );
}
