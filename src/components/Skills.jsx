import { Fragment, useRef } from "react";
import { useSkillsPreview } from "../hooks/useSkillsPreview.js";

// Official brand logos (colored) from Devicon, served over the jsDelivr CDN.
const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@2.16.0/icons";
const logo = (icon) => `${DEVICON}/${icon}/${icon}-original.svg`;

const rows = [
  {
    label: "Frontend",
    tools: [
      { name: "HTML", icon: "html5" },
      { name: "CSS", icon: "css3" },
      { name: "JavaScript", icon: "javascript" },
      { name: "React.js", icon: "react" },
      { name: "Tailwind CSS", icon: "tailwindcss" },
    ],
  },
  {
    label: "Backend",
    tools: [
      { name: "Node.js", icon: "nodejs" },
      { name: "Express.js", icon: "express" },
    ],
  },
  {
    label: "Database",
    tools: [{ name: "MongoDB", icon: "mongodb" }],
  },
  {
    label: "Languages",
    tools: [
      { name: "JavaScript", icon: "javascript" },
      { name: "Java", icon: "java" },
    ],
  },
  {
    label: "Tools",
    tools: [
      { name: "Git", icon: "git" },
      { name: "GitHub", icon: "github" },
      { name: "VS Code", icon: "vscode" },
      { name: "Postman", icon: "postman" },
    ],
  },
];

export default function Skills() {
  const sectionRef = useRef(null);
  const previewRef = useRef(null);
  const imgRef = useRef(null);

  useSkillsPreview(sectionRef, previewRef, imgRef);

  return (
    <section className="skills" id="skills" data-section="Skills" ref={sectionRef}>
      <p className="section__index">02 — Skills</p>
      <h2 className="section__title" data-split-chars>Toolkit</h2>

      <ul className="skills__list">
        {rows.map((row) => (
          <li className="skills__row" data-reveal key={row.label}>
            <span className="skills__label">{row.label}</span>
            <span className="skills__values">
              {row.tools.map((t, i) => (
                <Fragment key={t.name + i}>
                  {i > 0 && <span className="skills__sep"> · </span>}
                  <span className="skills__tool" data-logo={logo(t.icon)}>{t.name}</span>
                </Fragment>
              ))}
            </span>
          </li>
        ))}
      </ul>

      {/* Cursor-following logo tile, positioned by useSkillsPreview */}
      <div className="skills__preview" ref={previewRef} aria-hidden="true">
        <img ref={imgRef} alt="" width="72" height="72" />
      </div>
    </section>
  );
}
