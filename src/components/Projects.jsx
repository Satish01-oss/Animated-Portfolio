import { moreProjects } from "../data/cv.js";

/**
 * 04 — Projects: the rest of the CV's selected projects, set as CV entries.
 * The Work ring deals out the three with live sites (01–03); these carry on
 * the numbering, arriving as the lights come back up after it.
 *
 * Builds still under way carry a status tag. A private project shows its
 * name, what it is and one line — the rest of the entry is redacted, so the
 * gap reads as deliberate rather than as missing content.
 */
export default function Projects() {
  return (
    <section className="projects" id="projects" data-section="Projects">
      <p className="section__index">04 — Projects</p>
      <h2 className="section__title" data-split-chars>Beyond the reel</h2>
      <p className="projects__lede" data-reveal>
        Four more — a learning platform, two builds still in progress, and an
        ongoing line of 3D web experiments.
      </p>

      <ol className="projects__list">
        {moreProjects.map((p) => (
          <li className={`project${p.private ? " is-private" : ""}`} data-reveal key={p.no}>
            <span className="rule" data-draw aria-hidden="true" />
            <div className="project__head">
              <span className="project__no">{p.no}</span>
              <h3 className="project__name">{p.name}</h3>
              <p className="project__kind">{p.kind}</p>
              {(p.status || p.private) && (
                <p className="project__tags">
                  {p.status && (
                    <span className="project__status">
                      <span className="pulse" aria-hidden="true" />
                      {p.status}
                    </span>
                  )}
                  {p.private && <span className="project__private">Private</span>}
                </p>
              )}
            </div>
            <div className="project__body">
              <p className="project__summary">{p.summary}</p>
              {p.private ? (
                <div className="project__redacted" aria-hidden="true">
                  <span /><span /><span />
                </div>
              ) : (
                <ul className="project__points">
                  {p.points.map((pt) => <li key={pt}>{pt}</li>)}
                </ul>
              )}
              {p.stack && (
                <p className="project__stack">
                  <span className="visually-hidden">Built with: </span>
                  {p.stack.join(" · ")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
