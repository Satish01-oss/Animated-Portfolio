import { person } from "../data/cv.js";

/**
 * The credits: his name set across the full width, rising into view once as
 * the page ends — plain type, no canvas, nothing that repaints on scroll —
 * with the small print beneath it.
 */
export default function Footer() {
  return (
    <footer className="footer">
      {/* Decorative: the name is already the page's <h1>. */}
      <p className="footer__name" data-rise aria-hidden="true">
        <span>{person.name}</span>
      </p>
      <div className="footer__meta">
        <p>© {new Date().getFullYear()} {person.name}</p>
        <p>Built with React, Three.js, GSAP &amp; Lenis</p>
        <a href="#hero" data-cursor="Top">Back to top ↑</a>
      </div>
    </footer>
  );
}
