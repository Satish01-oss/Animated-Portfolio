export default function Nav({ theme, onToggleTheme }) {
  const isDark = theme === "dark";
  return (
    <header className="nav" id="nav">
      <a className="nav__brand" href="#hero" data-cursor="Top">SATISH<em>*</em></a>
      <nav className="nav__links" aria-label="Primary">
        <a href="#about">About</a>
        <a href="#skills">Skills</a>
        <a href="#showreel">Showreel</a>
        <a href="#work">Work</a>
        <a href="#contact">Contact</a>
      </nav>
      <button
        className="nav__theme"
        type="button"
        onClick={onToggleTheme}
        aria-pressed={isDark}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        <span className="nav__theme-dot" />
      </button>
    </header>
  );
}
