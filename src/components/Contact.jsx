import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon.jsx";
import { objective, person } from "../data/cv.js";

const EMAIL = "ss7233563@gmail.com";
// wa.me wants the number bare: country code, no +, no spaces.
const WHATSAPP = "919339974912";

const channels = [
  { id: "whatsapp",  name: "WhatsApp",  href: `https://wa.me/${WHATSAPP}`,                        cursor: "Chat" },
  { id: "linkedin",  name: "LinkedIn",  href: "https://linkedin.com/in/satish-kumar-ram-468a5b321", cursor: "Open" },
  { id: "github",    name: "GitHub",    href: "https://github.com/Satish01-oss",                  cursor: "Open" },
  { id: "instagram", name: "Instagram", href: "https://instagram.com/_satishkumar_ram_",          cursor: "Open" },
];

/** The time in India, refreshed every half minute — for anyone writing from
 *  another time zone and wondering when a reply is likely. */
function useIndiaTime() {
  const format = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
    []
  );
  const [time, setTime] = useState(() => format.format(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTime(format.format(new Date())), 30_000);
    return () => clearInterval(id);
  }, [format]);
  return time;
}

/**
 * 06 — Contact: the sign-off. "Let's build" and the CV's career objective on
 * the left; on the right, the ways to reach him as a short card — the
 * address (copyable in one click), the networks, and his local time.
 *
 * Deliberately still: after a page of pinned, scroll-driven set pieces, the
 * last screen is plain type that costs nothing to scroll past.
 */
export default function Contact() {
  const time = useIndiaTime();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${EMAIL}`;   // no clipboard access: just write
    }
  };

  return (
    <section className="contact" id="contact" data-section="Contact">
      <p className="section__index">06 — Contact</p>
      <h2 className="contact__title" data-split-chars>Let's build</h2>

      <div className="contact__grid">
        <p className="contact__lede" data-reveal>
          <span className="contact__key">Open to internships — career objective</span>
          {objective}
        </p>

        <dl className="contact__card" data-reveal>
          <div className="contact__row">
            <dt className="contact__key">Email</dt>
            <dd className="contact__email">
              <a className="contact__mail magnetic" href={`mailto:${EMAIL}`} data-cursor="Write">{EMAIL}</a>
              <button
                className={`contact__copy${copied ? " is-copied" : ""}`}
                type="button"
                onClick={copy}
                data-cursor={copied ? "Copied" : "Copy"}
              >
                <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
              </button>
            </dd>
          </div>

          <div className="contact__row">
            <dt className="contact__key">Elsewhere</dt>
            {/* Marks only: no handles, no URLs on screen. The destination still
                reaches assistive tech and the status bar through the href and
                the accessible name, so nothing is lost — it is just not printed. */}
            <dd>
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
            </dd>
          </div>

          <div className="contact__row">
            <dt className="contact__key">Local time</dt>
            <dd className="contact__time">
              <span className="pulse" aria-hidden="true" />
              {person.location} · {time} IST
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
