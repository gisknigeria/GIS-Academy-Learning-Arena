import { TrendingDown, TrendingUp } from "lucide-react";
import type { Stat } from "../data/dashboardData";

// Infer whether the note is positive, negative, or neutral
function parseTrend(note: string): "up" | "down" | "neutral" {
  if (/^\+|increase|improve|up|top/i.test(note)) return "up";
  if (/-[0-9]|declin|below|drop|down/i.test(note)) return "down";
  return "neutral";
}

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  const trend = parseTrend(stat.note);

  return (
    <article className="stat-card-v2" aria-label={`${stat.label}: ${stat.value}`}>
      <div className="stat-card-v2-top">
        <div className="stat-card-v2-icon">
          <Icon size={18} aria-hidden="true" />
        </div>
        {trend !== "neutral" && (
          <span className={`stat-trend stat-trend--${trend}`} aria-hidden="true">
            {trend === "up"
              ? <TrendingUp size={13} />
              : <TrendingDown size={13} />}
          </span>
        )}
      </div>

      <div className="stat-card-v2-value">{stat.value}</div>
      <div className="stat-card-v2-label">{stat.label}</div>
      <div className="stat-card-v2-note">{stat.note}</div>
    </article>
  );
}

type StatsGridProps = { stats: Stat[] };

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="stats-grid-v2" aria-label="Progress summary">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </section>
  );
}
