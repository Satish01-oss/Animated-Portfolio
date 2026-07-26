import { forwardRef } from "react";

// The canvas ref is forwarded from App, where the sequence hook owns it.
const Hero = forwardRef(function Hero(_, canvasRef) {
  return (
    <section className="hero" id="hero" data-section="Intro">
      <div className="hero__sticky">
        <canvas className="hero__canvas" ref={canvasRef} aria-hidden="true" />

        <div className="hero__marquee" aria-hidden="true">
          <div className="hero__marquee-track">
            <h1>FULL&#8209;STACK <em>MERN</em> DEVELOPER — <span>REACT</span> — <span>NODE</span> — <em>MONGODB</em> — </h1>
            <h1>FULL&#8209;STACK <em>MERN</em> DEVELOPER — <span>REACT</span> — <span>NODE</span> — <em>MONGODB</em> — </h1>
          </div>
        </div>

        <div className="hero__captions">
          <div className="hero__caption is-active" data-caption="0">
            <p className="hero__eyebrow">Portfolio — 2026</p>
            <h2 className="hero__title">Satish Kumar&nbsp;Ram</h2>
            <p className="hero__lede">BCA student. I build database&#8209;driven web applications end&#8209;to&#8209;end.</p>
          </div>
          <div className="hero__caption" data-caption="1">
            <p className="hero__eyebrow">The stack</p>
            <h2 className="hero__title">MongoDB. Express.<br /><em>React.</em> Node.</h2>
            <p className="hero__lede">Authentication systems, REST APIs, dashboards.</p>
          </div>
          <div className="hero__caption" data-caption="2">
            <p className="hero__eyebrow">The approach</p>
            <h2 className="hero__title">Ship it,<br />then <em>sharpen</em> it.</h2>
            <p className="hero__lede">Problem solving through projects and Data Structures &amp; Algorithms.</p>
          </div>
        </div>

        <p className="hero__scroll-hint">Scroll<span className="hero__scroll-line" /></p>
      </div>
    </section>
  );
});

export default Hero;
