import { useRef } from "react";
import Icon from "./Icon.jsx";
import { useBookend } from "../hooks/useBookend.js";
import { objective } from "../data/cv.js";

// wa.me wants the number bare: country code, no +, no spaces.
const WHATSAPP = "919339974912";

const channels = [
  { id: "whatsapp",  name: "WhatsApp",  href: `https://wa.me/${WHATSAPP}`,                        cursor: "Chat" },
  { id: "linkedin",  name: "LinkedIn",  href: "https://linkedin.com/in/satish-kumar-ram-468a5b321", cursor: "Open" },
  { id: "github",    name: "GitHub",    href: "https://github.com/Satish01-oss",                  cursor: "Open" },
  { id: "instagram", name: "Instagram", href: "https://instagram.com/_satishkumar_ram_",          cursor: "Open" },
];

/**
 * 06 — Contact, and the page's closing shot: the character from the opening
 * returns and turns to face the visitor as the section arrives (useBookend).
 * The heading sits BEHIND him, as the hero's marquee does — the same depth
 * trick, so the last screen answers the first.
 */
export default function Contact({ ready, sequence }) {
  const canvasRef = useRef(null);
  useBookend(ready, canvasRef, sequence);

  return (
    <section className="contact" id="contact" data-section="Contact">
      <div className="contact__figure" aria-hidden="true">
        <canvas className="contact__canvas" ref={canvasRef} />
      </div>

      <div className="contact__body">
        <p className="section__index">06 — Contact</p>
        <h2 className="contact__title" data-split-chars>Let's build</h2>

        {/* The CV's career objective closes the page. */}
        <p className="contact__lede" data-reveal>
          <span className="contact__lede-key">Open to internships — career objective</span>
          {objective}
        </p>

        {/* No icon here on purpose — the address is the thing worth reading. */}
        <a className="contact__mail magnetic" href="mailto:ss7233563@gmail.com" data-cursor="Mail">
          ss7233563@gmail.com
        </a>

        {/* Marks only: no handles, no URLs on screen. The destination still
            reaches assistive tech and the status bar through the href and the
            accessible name, so nothing is lost — it is just not printed. */}
        <ul className="contact__list">
          {channels.map((c) => (
            <li key={c.id}>
              <a
                className={`contact__mark is-${c.id}`}
                href={c.href}
                target="_blank"
                rel="noopener"
                aria-label={c.name}
                title={c.name}
                data-cursor={c.cursor}
              >
                <Icon name={c.id} label={c.name} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
