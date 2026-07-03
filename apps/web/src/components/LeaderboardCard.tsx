import { Trophy } from "lucide-react";

type LeaderboardRow = {
  rank: number;
  name: string;
  area: string;
  score: string;
  self?: boolean;
};

type LeaderboardCardProps = {
  rows: LeaderboardRow[];
};

export function LeaderboardCard({ rows }: LeaderboardCardProps) {
  return (
    <section className="rank-card">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Leaderboard</span>
          <h2>National rank</h2>
        </div>
        <Trophy size={22} />
      </div>
      <div className="leaderboard">
        {rows.map((row) => (
          <div className={row.self ? "leader-row self" : "leader-row"} key={`${row.rank}-${row.name}`}>
            <span>#{row.rank}</span>
            <div>
              <strong>{row.name}</strong>
              <small>{row.area}</small>
            </div>
            <em>{row.score}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
