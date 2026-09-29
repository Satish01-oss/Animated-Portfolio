import Icon from "./Icon.jsx";

// wa.me wants the number bare: country code, no +, no spaces.
const WHATSAPP = "919339974912";

const channels = [
  { id: "whatsapp",  name: "WhatsApp",  href: `https://wa.me/${WHATSAPP}`,                        cursor: "Chat" },
  { id: "linkedin",  name: "LinkedIn",  href: "https://linkedin.com/in/satish-kumar-ram-468a5b321", cursor: "Open" },
  { id: "github",    name: "GitHub",    href: "https://github.com/Satish01-oss",                  cursor: "Open" },
  { id: "instagram", name: "Instagram", href: "https://instagram.com/_satishkumar_ram_",          cursor: "Open" },
];

export default function Contact() {
  return (
    <section className="contact" id="contact" data-section="Contact">
      <p className="section__index">06 — Contact</p>
      <h2 className="contact__title" data-split-chars>Let's build</h2>

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
    </section>
  );
}
