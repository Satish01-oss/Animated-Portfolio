export default function Contact() {
  return (
    <section className="contact" id="contact" data-section="Contact">
      <p className="section__index">05 — Contact</p>
      <h2 className="contact__title" data-split-chars>Let's build</h2>
      <a className="contact__mail magnetic" href="mailto:ss7233563@gmail.com" data-cursor="Mail">
        ss7233563@gmail.com
      </a>
      <ul className="contact__list">
        <li>
          <span>Phone</span>
          <a href="tel:+919339974912" data-cursor="Call">+91 93399 74912</a>
        </li>
        <li>
          <span>LinkedIn</span>
          <a href="https://linkedin.com/in/satish-kumar-ram-468a5b321" target="_blank" rel="noopener" data-cursor="Open">satish-kumar-ram</a>
        </li>
        <li>
          <span>GitHub</span>
          <a href="https://github.com/Satish01-oss" target="_blank" rel="noopener" data-cursor="Open">Satish01-oss</a>
        </li>
      </ul>
    </section>
  );
}
