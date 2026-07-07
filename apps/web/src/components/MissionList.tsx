import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Mission } from "../data/dashboardData";

const TONE_CONFIG = {
  green:  { border: "var(--brand-700)", icon: "#e8f8ef", iconColor: "var(--brand-700)", btn: "var(--brand-700)", btnText: "#fff" },
  orange: { border: "var(--orange)",    icon: "#fff4e8", iconColor: "var(--orange)",    btn: "var(--orange)",    btnText: "#fff" },
  blue:   { border: "var(--blue)",      icon: "#edf3ff", iconColor: "var(--blue)",      btn: "var(--blue)",      btnText: "#fff" },
} as const;

type MissionListProps = {
  missions: Mission[];
};

export function MissionList({ missions }: MissionListProps) {
  const navigate = useNavigate();

  return (
    <div className="mission-list-v2">
      {missions.map((mission) => {
        const Icon = mission.icon;
        const cfg  = TONE_CONFIG[mission.tone];

        return (
          <article
            className="mission-card"
            key={mission.title}
            style={{ "--mission-accent": cfg.border } as React.CSSProperties}
          >
            {/* Left accent bar */}
            <div className="mission-card-bar" aria-hidden="true" />

            {/* Icon */}
            <div
              className="mission-card-icon"
              style={{ background: cfg.icon, color: cfg.iconColor }}
              aria-hidden="true"
            >
              <Icon size={20} />
            </div>

            {/* Copy */}
            <div className="mission-card-copy">
              <h3>{mission.title}</h3>
              <p>{mission.meta}</p>
            </div>

            {/* CTA */}
            <button
              className="mission-card-btn"
              style={{ background: cfg.btn, color: cfg.btnText }}
              onClick={() => navigate(mission.route)}
              type="button"
              aria-label={`${mission.action}: ${mission.title}`}
            >
              <span>{mission.action}</span>
              <ArrowRight size={14} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
