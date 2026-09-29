import { useRef } from "react";
import { useSkillsPreview } from "../hooks/useSkillsPreview.js";
import { skills } from "../data/cv.js";

/**
 * 02 — Skills: the CV's technical skills as a five-column spec sheet — one
 * group per column, one skill per line, nothing competing for attention.
 *
 * A dot marks the MERN core, the same four words the hero's second caption
 * sets in large type. Hovering a tool that has an official mark summons it
 * on a cursor-following tile (useSkillsPreview); concepts stay plain text.
 */
export default function Skills() {
  const sectionRef = useRef(null);
  const previewRef = useRef(null);
  const imgRef = useRef(null);

  useSkillsPreview(sectionRef, previewRef, imgRef);

  return (
    <section className="skills" id="skills" data-section="Skills" ref={sectionRef}>
      <p className="section__index">02 — Skills</p>

      <div className="skills__head">
        <h2 className="section__title" data-split-chars>Toolkit</h2>
        {/* The leading dot is the key to the dots in the table. */}
        <p className="skills__lede" data-reveal>
          <span className="skills__dot" aria-hidden="true" />MERN at the core — with
          3D, motion and AI on top.
        </p>
      </div>

      <div className="skills__grid">
        {skills.map((group, g) => (
          <div className="skills__group" key={group.label}>
            {/* The hover dim acts on this wrapper: the head and items inside
                carry inline opacity from their scroll reveals. */}
            <div className="skills__group-body">
              <div className="skills__group-head" data-reveal>
                <span className="skills__no">{String(g + 1).padStart(2, "0")}</span>
                <h3 className="skills__name">{group.label}</h3>
              </div>
              <ul className="skills__items" data-stagger={(g * 0.07).toFixed(2)}>
                {group.tools.map((t) => (
                  <li key={t.name}>
                    {t.logo
                      ? <span className="skills__tool" data-logo={t.logo}>{t.name}</span>
                      : <span>{t.name}</span>}
                    {t.core && (
                      <>
                        <span className="skills__dot" aria-hidden="true" />
                        <span className="visually-hidden"> (MERN core)</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Cursor-following logo tile, positioned by useSkillsPreview */}
      <div className="skills__preview" ref={previewRef} aria-hidden="true">
        <img ref={imgRef} alt="" width="72" height="72" />
      </div>
    </section>
  );
}
