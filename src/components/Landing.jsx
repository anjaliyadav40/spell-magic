import { useState } from "react";

function Landing({ onStart }) {
  const [mouse, setMouse] = useState({
    x: 50,
    y: 50,
  });

  function handleMouseMove(event) {
    setMouse({
      x: (event.clientX / window.innerWidth) * 100,
      y: (event.clientY / window.innerHeight) * 100,
    });
  }

  return (
    <main
      className="landing-page"
      onMouseMove={handleMouseMove}
      style={{
        "--mouse-x": `${mouse.x}%`,
        "--mouse-y": `${mouse.y}%`,
      }}
    >
      {/* BACKGROUND STARS */}

      <div className="landing-stars">
        <span>✦</span>
        <span>✧</span>
        <span>✦</span>
        <span>✧</span>
        <span>✦</span>
        <span>✧</span>
        <span>✦</span>
        <span>✧</span>
        <span>✦</span>
        <span>✧</span>
      </div>

      {/* NEBULA */}

      <div className="landing-nebula nebula-one" />
      <div className="landing-nebula nebula-two" />

      {/* MOUSE MAGIC */}

      <div className="landing-mouse-glow" />

      {/* ORBITS */}

      <div className="landing-orbit orbit-one" />
      <div className="landing-orbit orbit-two" />

      {/* MAIN CONTENT */}

      <section className="landing-content">
        <div className="landing-symbol">
          ✦
        </div>

        <p className="landing-eyebrow">
          A CAMERA-BASED MAGIC EXPERIENCE
        </p>

        <h1 className="landing-title">
          SPELL
          <span>MAGIC</span>
        </h1>

        <p className="landing-description">
          Turn your hands into magic.
          <br />
          Cast spells, summon stars,
          <br />
          grow flowers and bend reality.
        </p>

        <button
          type="button"
          className="landing-start-button"
          onClick={onStart}
        >
          <span>ENTER THE MAGIC</span>
          <span className="button-arrow">
            →
          </span>
        </button>

        <div className="landing-hint">
          <span>✦</span>
          Allow camera access to begin
          <span>✦</span>
        </div>
      </section>

      {/* FLOATING SPELLS */}

      <div className="landing-spell spell-one">
        🌸
      </div>

      <div className="landing-spell spell-two">
        ⭐
      </div>

      <div className="landing-spell spell-three">
        💗
      </div>

      <div className="landing-spell spell-four">
        ⚡
      </div>

      <div className="landing-spell spell-five">
        🫥
      </div>
    </main>
  );
}

export default Landing;