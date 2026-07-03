import type { Stat } from "../data/dashboardData";

type StatsGridProps = {
  stats: Stat[];
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="stats-grid" aria-label="Progress summary">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <article className="stat-card" key={stat.label}>
            <div className="stat-icon">
              <Icon size={19} />
            </div>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </article>
        );
      })}
    </section>
  );
}
