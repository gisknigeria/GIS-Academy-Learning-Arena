import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArenaLobby } from "../components/ArenaLobby";
import { HeroArena } from "../components/HeroArena";
import { LeaderboardCard } from "../components/LeaderboardCard";
import { LiveStatsGrid } from "../components/LiveStatsGrid";
import { MissionList } from "../components/MissionList";
import { QuickActionsGrid } from "../components/QuickActionsGrid";
import { SectionHeading } from "../components/SectionHeading";
import { StatsGrid } from "../components/StatsGrid";
import { TrainerReviewCard } from "../components/TrainerReviewCard";
import { useAuth } from "../context/AuthContext";
import {
  competitions as staticCompetitions,
  getQuickActions,
  getMissionsByRole,
  getStatsByRole,
  leaderboard,
} from "../data/dashboardData";
import { dashboardApi, type DashboardStats } from "../lib/dashboard-api";
import { competitionsApi } from "../lib/competitions-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type { Competition } from "../types/competition";

export function DashboardPage() {
  const { user, token } = useAuth();
  const role = user?.role ?? "GUEST";

  // Live stats from API
  const [liveStats, setLiveStats] = useState<DashboardStats | null>(null);

  // Live competitions for arena lobby
  const [liveCompetitions, setLiveCompetitions] = useState<Competition[]>([]);

  const staticStats = getStatsByRole(role);
  const missions = getMissionsByRole(role);
  const quickActions = getQuickActions(role);

  const showAdminLayout = isAdminRole(role) || isInstructorRole(role);
  const isCoord =
    role === "SCHOOL_COORDINATOR" ||
    role === "CORPORATE_CLIENT" ||
    role === "OLYMPIAD_COORDINATOR" ||
    role === "JUDGE";

  const loadLiveData = useCallback(async () => {
    if (!token) return;
    // Fire both in parallel — failures are silent (fall back to static data)
    const [statsResult, compResult] = await Promise.allSettled([
      dashboardApi.getStats(token),
      competitionsApi.list(token),
    ]);
    if (statsResult.status === "fulfilled") setLiveStats(statsResult.value);
    if (compResult.status === "fulfilled") setLiveCompetitions(compResult.value);
  }, [token]);

  useEffect(() => {
    void loadLiveData();
  }, [loadLiveData]);

  return (
    <>
      <HeroArena />

      {/* Stats — live if loaded, static fallback while loading */}
      {liveStats ? (
        <LiveStatsGrid stats={liveStats.stats} />
      ) : (
        <StatsGrid stats={staticStats} />
      )}

      {/* Quick actions panel — admin / instructor roles */}
      {showAdminLayout && quickActions.length > 0 && (
        <>
          <SectionHeading eyebrow="Shortcuts" title="Quick actions" />
          <QuickActionsGrid actions={quickActions} />
        </>
      )}

      <section className="content-grid">
        <div className="workstream">
          <SectionHeading eyebrow="Next actions" title="Daily mission path" action="See all" />
          <MissionList missions={missions} />

          {/* Arena lobby — student / alumni / olympiad roles */}
          {(role === "STUDENT" ||
            role === "ALUMNI" ||
            role === "GUEST" ||
            role === "OLYMPIAD_COORDINATOR" ||
            role === "JUDGE") && (
            <>
              <SectionHeading eyebrow="Active competitions" title="Arena lobby" compact />
              <ArenaLobby
                liveCompetitions={liveCompetitions.length > 0 ? liveCompetitions : undefined}
                competitions={staticCompetitions}
              />
            </>
          )}
        </div>

        <aside className="insight-column">
          {/* Leaderboard */}
          {(role === "STUDENT" ||
            role === "ALUMNI" ||
            role === "OLYMPIAD_COORDINATOR" ||
            role === "JUDGE") && <LeaderboardCard rows={leaderboard} />}

          {/* Trainer review card */}
          {(role === "STUDENT" || role === "TRAINER" || role === "EXAMINER") && (
            <TrainerReviewCard />
          )}

          {/* Admin insight — live numbers */}
          {showAdminLayout && <AdminInsightPanel role={role} liveStats={liveStats} />}

          {/* Coordinator insight */}
          {isCoord && !showAdminLayout && <CoordinatorInsightPanel role={role} liveStats={liveStats} />}
        </aside>
      </section>
    </>
  );
}

// ─── Admin insight panel (live data) ─────────────────────────────────────────

function AdminInsightPanel({
  role,
  liveStats,
}: {
  role: string;
  liveStats: DashboardStats | null;
}) {
  // Build live insight items from the API stats when available
  const items = liveStats?.stats ?? [];

  return (
    <section className="insight-panel">
      <div className="insight-panel-header">
        <h2>Platform snapshot</h2>
        <Link className="insight-view-all" to="/reports">View reports →</Link>
      </div>

      {items.length > 0 ? (
        <ul className="insight-list">
          {items.map((stat) => {
            const dot =
              stat.key === "pending" || stat.key === "submissions"
                ? "dot-orange"
                : stat.key === "certificates" || stat.key === "classes"
                ? "dot-blue"
                : "dot-green";
            return (
              <li key={stat.key}>
                <span className={`insight-dot ${dot}`} />
                <div>
                  <strong>{stat.value} {stat.label.toLowerCase()}</strong>
                  <small>{stat.note}</small>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        // Static fallback while loading
        <ul className="insight-list">
          {role === "SUPER_ADMIN" && (
            <>
              <li><span className="insight-dot dot-orange" /><div><strong>—</strong><small>Pending approvals</small></div></li>
              <li><span className="insight-dot dot-green" /><div><strong>—</strong><small>Active courses</small></div></li>
              <li><span className="insight-dot dot-blue" /><div><strong>—</strong><small>Certificates issued</small></div></li>
            </>
          )}
          {(role === "ADMIN" || role === "TRAINING_MANAGER") && (
            <>
              <li><span className="insight-dot dot-orange" /><div><strong>—</strong><small>Submissions awaiting grading</small></div></li>
              <li><span className="insight-dot dot-green" /><div><strong>—</strong><small>Active learners</small></div></li>
              <li><span className="insight-dot dot-blue" /><div><strong>—</strong><small>Certificates issued</small></div></li>
            </>
          )}
          {(role === "TRAINER" || role === "EXAMINER") && (
            <>
              <li><span className="insight-dot dot-orange" /><div><strong>—</strong><small>Pending submissions</small></div></li>
              <li><span className="insight-dot dot-green" /><div><strong>—</strong><small>Assessment attempts</small></div></li>
              <li><span className="insight-dot dot-blue" /><div><strong>—</strong><small>Active classes</small></div></li>
            </>
          )}
        </ul>
      )}
    </section>
  );
}

// ─── Coordinator insight panel ────────────────────────────────────────────────

function CoordinatorInsightPanel({
  role,
  liveStats,
}: {
  role: string;
  liveStats: DashboardStats | null;
}) {
  const items = liveStats?.stats ?? [];

  return (
    <section className="insight-panel">
      <h2>Group snapshot</h2>
      {items.length > 0 ? (
        <ul className="insight-list">
          {items.map((stat) => (
            <li key={stat.key}>
              <span className="insight-dot dot-green" />
              <div>
                <strong>{stat.value} {stat.label.toLowerCase()}</strong>
                <small>{stat.note}</small>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="insight-list">
          <li><span className="insight-dot dot-green" /><div><strong>—</strong><small>Loading…</small></div></li>
        </ul>
      )}
    </section>
  );
}
