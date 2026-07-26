import { projects } from "../data/projects.js";

export default function Work() {
  return (
    <section className="work" id="work" data-section="Work">
      <div className="work__viewport">
        <div className="work__track" id="workTrack">
          <div className="work__intro">
            <p className="section__index">03 — Selected work</p>
            <h2 className="section__title">Three<br />things I<br /><em>built</em>.</h2>
            <p className="work__hint">Drag or scroll →</p>
          </div>

          {projects.map((p) => (
            <article className="card" data-reveal key={p.no}>
              <a className="card__media" href={p.live} target="_blank" rel="noopener" data-cursor="Visit">
                <img
                  src={p.image}
                  width="1440"
                  height="900"
                  loading="lazy"
                  decoding="async"
                  alt={p.alt}
                />
              </a>
              <div className="card__body">
                <div className="card__head">
                  <span className="card__no">{p.no}</span>
                  <span className="card__tag">{p.tag}</span>
                </div>
                <h3 className="card__title">{p.title}</h3>
                <ul className="card__points">
                  {p.points.map((pt) => <li key={pt}>{pt}</li>)}
                </ul>
                <div className="card__links">
                  <a className="magnetic" href={p.repo} target="_blank" rel="noopener" data-cursor="Code">Repository</a>
                  <a className="magnetic" href={p.live} target="_blank" rel="noopener" data-cursor="Visit">Live demo</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
