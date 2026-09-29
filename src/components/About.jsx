import { facts, profile } from "../data/cv.js";

/**
 * 01 — Profile: the CV's profile paragraph, rendered inside the hero's
 * pinned stage (see Hero.jsx). The statement resolves word by word as the
 * visitor scrolls, beside the profile card the character has just been
 * framed into; the facts underneath are the CV's personal details.
 */
export default function About() {
  return (
    <section className="about" aria-labelledby="profile-title">
      <p className="section__index" id="profile-title">01 — Profile</p>
      <p className="about__statement">{profile}</p>
      <dl className="about__meta">
        {facts.map(([key, val]) => (
          <div className="about__meta-item" key={key}>
            <dt className="about__meta-key">{key}</dt>
            <dd className="about__meta-val">{val}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
