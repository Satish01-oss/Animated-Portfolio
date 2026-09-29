import { education } from "../data/cv.js";

/** 05 — Education, from the CV: the degree, where, and what it covers. */
export default function Education() {
  const e = education;
  return (
    <section className="education" id="education" data-section="Education">
      <p className="section__index">05 — Education</p>
      <div className="edu" data-reveal>
        <span className="rule" data-draw aria-hidden="true" />
        <div className="edu__year">{e.years} <span>({e.note})</span></div>
        <div className="edu__body">
          <h3 className="edu__degree">{e.degree}</h3>
          <p className="edu__place">
            {e.school}<br />
            {e.university}
          </p>
          <p className="edu__areas-key">Relevant areas</p>
          <ul className="edu__areas">
            {e.areas.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
