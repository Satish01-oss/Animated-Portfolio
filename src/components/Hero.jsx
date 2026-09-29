import { forwardRef } from "react";
import About from "./About.jsx";
import { person } from "../data/cv.js";

/**
 * The opening chapter: the character sequence, then — without cutting away —
 * he turns back to the pose he had when the page opened and the shot closes
 * into his profile card, with the Profile text arriving beside it. About
 * lives inside the hero's sticky stage for that reason: it is the second half
 * of one shot, not a new section.
 *
 * The canvas ref is forwarded from App, where the sequence hook owns it.
 */
const Hero = forwardRef(function Hero(_, canvasRef) {
  return (
    <section className="hero" id="hero" data-section="Intro">
      <div className="hero__sticky">
        {/* The profile card's paper. Invisible through the sequence; useIntro
            grows it round the photo as the shot closes, and the name plate
            underneath is the CV's header — name and headline. */}
        <div className="hero__frame" aria-hidden="true">
          <div className="hero__plate">
            <span className="hero__plate-name">{person.name}</span>
            <span className="hero__plate-role">{person.headline.map((h) => h.replace(" Developer", "")).join(" · ")}</span>
          </div>
        </div>

        {/* Everything the photo carries: its paper, the marquee band and the
            canvas. useIntro clips and moves this one element, so the three
            stay registered to each other — the card is the opening frame,
            marquee and all, in miniature. */}
        <div className="hero__media">
          <div className="hero__card" aria-hidden="true" />
          <div className="hero__marquee" aria-hidden="true">
            <div className="hero__marquee-track">
              {[0, 1].map((n) => (
                <p key={n}>MERN&nbsp;STACK <em>DEVELOPER</em> — <span>FRONTEND</span> — <em>INTERACTIVE</em> WEB — <span>THREE.JS</span> — </p>
              ))}
            </div>
          </div>
          <canvas className="hero__canvas" ref={canvasRef} aria-hidden="true" />
        </div>

        <div className="hero__captions">
          <div className="hero__caption is-active">
            <p className="hero__eyebrow">Portfolio · CV — 2026</p>
            <h1 className="hero__title">{person.name}</h1>
            <p className="hero__lede">MERN stack, frontend and interactive web developer. BCA student, {person.location}.</p>
          </div>
          <div className="hero__caption">
            <p className="hero__eyebrow">The stack</p>
            <h2 className="hero__title">MongoDB. Express.<br /><em>React.</em> Node.</h2>
            <p className="hero__lede">React, JavaScript and Tailwind CSS up front — Three.js, React Three Fiber and GSAP when it needs to move.</p>
          </div>
          <div className="hero__caption">
            <p className="hero__eyebrow">The objective</p>
            <h2 className="hero__title">Ship it,<br />then <em>sharpen</em> it.</h2>
            <p className="hero__lede">Building real&#8209;world products while strengthening the fundamentals underneath them.</p>
          </div>
        </div>

        <p className="hero__scroll-hint">Scroll<span className="hero__scroll-line" /></p>

        <About />

        {/* Darkens the whole stage as Skills slides up over it. */}
        <div className="hero__shade" aria-hidden="true" />
      </div>

      {/* The Profile half of the shot has no box of its own in the flow — it
          is pinned inside the stage — so these give it one: the scroll range
          the progress rail labels "Profile", and where the nav link lands
          (the point the statement has fully resolved). */}
      <div className="hero__range" data-section="Profile" aria-hidden="true" />
      <span className="hero__anchor" id="profile" aria-hidden="true" />
    </section>
  );
});

export default Hero;
