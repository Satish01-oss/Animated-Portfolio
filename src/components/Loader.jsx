/**
 * Full-screen loader shown until the priority frames decode. `progress`
 * is 0–1; `done` triggers the fade-out. Kept mounted through the fade so
 * the transition can play, then unmounted by the parent.
 */
export default function Loader({ progress, done }) {
  const pct = Math.round(progress * 100);
  return (
    <div className={`loader${done ? " is-done" : ""}`}>
      <div className="loader__inner">
        <p className="loader__name">Satish Kumar Ram</p>
        <div className="loader__bar">
          <span className="loader__fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="loader__count">{pct}%</p>
      </div>
    </div>
  );
}
