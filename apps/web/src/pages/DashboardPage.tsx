import { ArenaLobby } from "../components/ArenaLobby";
import { HeroArena } from "../components/HeroArena";
import { LeaderboardCard } from "../components/LeaderboardCard";
import { MissionList } from "../components/MissionList";
import { SectionHeading } from "../components/SectionHeading";
import { StatsGrid } from "../components/StatsGrid";
import { TrainerReviewCard } from "../components/TrainerReviewCard";
import { competitions, leaderboard, missions, stats } from "../data/dashboardData";

export function DashboardPage() {
  return (
    <>
      <HeroArena />
      <StatsGrid stats={stats} />

      <section className="content-grid">
        <div className="workstream">
          <SectionHeading eyebrow="Next actions" title="Daily mission path" action="See all" />
          <MissionList missions={missions} />
          <SectionHeading eyebrow="Active competitions" title="Arena lobby" compact />
          <ArenaLobby competitions={competitions} />
        </div>

        <aside className="insight-column">
          <LeaderboardCard rows={leaderboard} />
          <TrainerReviewCard />
        </aside>
      </section>
    </>
  );
}
