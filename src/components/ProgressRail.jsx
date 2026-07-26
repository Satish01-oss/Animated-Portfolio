/**
 * Replaces the hidden native scrollbar. The refs are written imperatively
 * by useLenis on every animation frame (fill scale, percentage text, and
 * the cross-fading section label) so scrolling never triggers a re-render.
 */
export default function ProgressRail({ fillRef, pctRef, labelRef }) {
  return (
    <div className="progress" aria-hidden="true">
      <span className="progress__label" ref={labelRef}>Intro</span>
      <span className="progress__rail">
        <span className="progress__fill" ref={fillRef} />
      </span>
      <span className="progress__pct" ref={pctRef}>00</span>
    </div>
  );
}
