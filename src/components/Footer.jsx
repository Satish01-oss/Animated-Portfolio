export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Satish Kumar Ram</p>
      <p>Built with React, GSAP &amp; Lenis</p>
      <a href="#hero" data-cursor="Top">Back to top ↑</a>
    </footer>
  );
}
