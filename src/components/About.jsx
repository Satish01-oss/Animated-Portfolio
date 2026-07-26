export default function About() {
  const meta = [
    ["Based in", "India"],
    ["Focus", "Full-stack MERN"],
    ["Languages", "English, Hindi"],
    ["Status", "Open to internships"],
  ];
  return (
    <section className="about" id="about" data-section="About">
      <p className="section__index">01 — About</p>
      <p className="about__statement" data-split-lines>
        BCA student with hands&#8209;on experience in full&#8209;stack web development using the
        MERN stack. I build responsive web applications, authentication systems, REST APIs
        and database&#8209;driven platforms — and I keep sharpening the fundamentals through
        projects and Data Structures &amp; Algorithms.
      </p>
      <div className="about__meta">
        {meta.map(([key, val]) => (
          <div className="about__meta-item" data-reveal key={key}>
            <span className="about__meta-key">{key}</span>
            <span className="about__meta-val">{val}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
