import { Play, Trophy } from "lucide-react";

export function HeroArena() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Live learning command center</span>
        <h1>Learn GIS, complete missions, and climb the national arena.</h1>
        <p>
          A simple daily path for students, trainers, schools, and teams with serious learning
          tools wrapped in a competitive experience.
        </p>
        <div className="hero-actions">
          <button className="primary-button">
            <Play size={18} />
            Continue learning
          </button>
          <button className="secondary-button">
            <Trophy size={18} />
            Enter arena
          </button>
        </div>
      </div>
      <div className="arena-preview" aria-label="Live arena status">
        <div className="pulse-row">
          <span className="live-dot" />
          Live challenge
        </div>
        <h2>Location Intelligence Sprint</h2>
        <div className="timer">07:42</div>
        <div className="duel">
          <span>Team Oyo</span>
          <strong>840</strong>
          <em>vs</em>
          <strong>790</strong>
          <span>Team Lagos</span>
        </div>
      </div>
    </section>
  );
}
