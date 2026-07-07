import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArenaLobby } from "../components/ArenaLobby";
import { GameQuestPanel } from "../components/GameQuestPanel";
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
import { dashboardApi, type DashboardPublicStats } from "../lib/dashboard-api";
import { competitionsApi } from "../lib/competitions-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type { Competition } from "../types/competition";

export function DashboardPage() {
  const { user, token } = useAuth();
  const role = user?.role ?? "GUEST";

  // Live stats from API
  const [liveStats, setLiveStats] = useState<DashboardPublicStats | null>(null);

  // Live competitions for arena lobby
  const [liveCompetitions, setLiveCompetitions] = useState<Competition[]>([]);

  const staticStats = getStatsByRole(role);
  const missions = getMissionsByRole(role);
  const quickActions = getQuickActions(role);

  const showTrainerLayout = role === "TRAINER" || role === "EXAMINER";
  const showAdminLayout = isAdminRole(role);
  const showStaffLayout = showAdminLayout || showTrainerLayout;
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
      {showStaffLayout && quickActions.length > 0 && (
        <>
          <SectionHeading eyebrow="Shortcuts" title="Quick actions" />
          <QuickActionsGrid actions={quickActions} />
        </>
      )}

      {showStaffLayout && (
        <>
          {showTrainerLayout ? (
            <>
              <SectionHeading eyebrow="Instructor dashboard" title="Trainer overview" action="Manage classes" />
              <TrainerDashboardPanels liveStats={liveStats} />
            </>
          ) : (
            <>
              <SectionHeading eyebrow="Admin analytics" title="Platform overview" action="View reports" />
              <AdminDashboardPanels liveStats={liveStats} />
            </>
          )}
        </>
      )}

      <section className="content-grid">
        <div className="workstream">
          <SectionHeading eyebrow="Next actions" title="Daily mission path" action="See all" />
          <GameQuestPanel />
          <MissionList missions={missions} />

          {/* Student dashboard panels */}
          {(role === "STUDENT" || role === "ALUMNI" || role === "GUEST") && (
            <>
              <SectionHeading eyebrow="My learning" title="Student dashboard" />
              <StudentDashboardPanels liveStats={liveStats} />
            </>
          )}

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
  liveStats: DashboardPublicStats | null;
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
  liveStats: DashboardPublicStats | null;
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

function AdminDashboardPanels({ liveStats }: { liveStats: DashboardPublicStats | null }) {
  const users = liveStats?.recentUsers ?? [];
  const submissions = liveStats?.recentSubmissions ?? [];
  const competitions = liveStats?.activeCompetitions ?? [];
  const paymentSummary = liveStats?.paymentSummary;
  const platformHealth = liveStats?.platformHealth;

  return (
    <section className="admin-dashboard-grid">
      <div className="admin-card admin-card-summary">
        <div className="admin-card-header">
          <h3>Payment summary</h3>
          <small>Based on learner payment status</small>
        </div>
        {paymentSummary ? (
          <dl className="admin-summary-list">
            <div>
              <dt>Provider</dt>
              <dd>{paymentSummary.provider}</dd>
            </div>
            <div>
              <dt>Paid learners</dt>
              <dd>{paymentSummary.paidLearners}</dd>
            </div>
            <div>
              <dt>Pending payments</dt>
              <dd>{paymentSummary.pendingPayments}</dd>
            </div>
            <div>
              <dt>Overdue payments</dt>
              <dd>{paymentSummary.overduePayments}</dd>
            </div>
            <div className="admin-summary-note">
              <dd>{paymentSummary.revenueNote}</dd>
            </div>
          </dl>
        ) : (
          <p>Loading payment summary…</p>
        )}
      </div>

      <div className="admin-card admin-card-summary">
        <div className="admin-card-header">
          <h3>Platform health</h3>
          <small>Real-time service status</small>
        </div>
        {platformHealth ? (
          <ul className="admin-status-list">
            <li>
              <strong>{platformHealth.uptime}</strong>
              <span>Uptime</span>
            </li>
            <li>
              <strong>{platformHealth.dbConnected ? "Connected" : "Disconnected"}</strong>
              <span>Database</span>
            </li>
            <li>
              <strong>{platformHealth.apiHealthy ? "Healthy" : "Degraded"}</strong>
              <span>API status</span>
            </li>
          </ul>
        ) : (
          <p>Checking platform health…</p>
        )}
      </div>

      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Recent users</h3>
          <small>Latest registrations and payment status</small>
        </div>
        <ul className="admin-list">
          {users.length > 0 ? (
            users.map((user) => (
              <li key={user.id}>
                <div>
                  <strong>{user.fullName}</strong>
                  <small>{user.email}</small>
                </div>
                <div className="admin-badges">
                  <span>{user.role}</span>
                  <span>{user.paymentStatus}</span>
                </div>
              </li>
            ))
          ) : (
            <li>Loading recent users…</li>
          )}
        </ul>
      </div>

      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Pending submissions</h3>
          <small>Most recent learner uploads</small>
        </div>
        <ul className="admin-list">
          {submissions.length > 0 ? (
            submissions.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.assignmentTitle}</strong>
                  <small>{item.studentName}</small>
                </div>
                <div>
                  <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
                  <small>{item.status}</small>
                </div>
              </li>
            ))
          ) : (
            <li>Loading submissions…</li>
          )}
        </ul>
      </div>

      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Active competitions</h3>
          <small>Open and live events</small>
        </div>
        <ul className="admin-list">
          {competitions.length > 0 ? (
            competitions.map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.mode} • {event.status}</small>
                </div>
                <div>
                  <span>{event.participants} participants</span>
                  <small>{event.startsAt ? new Date(event.startsAt).toLocaleDateString() : "TBD"}</small>
                </div>
              </li>
            ))
          ) : (
            <li>Loading competitions…</li>
          )}
        </ul>
      </div>
    </section>
  );
}

function TrainerDashboardPanels({ liveStats }: { liveStats: DashboardPublicStats | null }) {
  const classes = liveStats?.assignedClasses ?? [];
  const attendance = liveStats?.attendanceSummary ?? [];
  const submissions = liveStats?.recentSubmissions ?? [];
  const progress = liveStats?.learnerProgress;
  const sessions = liveStats?.upcomingSessions ?? [];

  return (
    <section className="trainer-dashboard-grid">
      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Assigned classes</h3>
          <small>Classes you are teaching</small>
        </div>
        <ul className="admin-list">
          {classes.length > 0 ? (
            classes.map((cohort) => (
              <li key={cohort.id}>
                <div>
                  <strong>{cohort.name}</strong>
                  <small>{cohort.courseCode} • {cohort.courseTitle}</small>
                </div>
                <div className="admin-badges">
                  <span>{cohort.students} students</span>
                  <span>{cohort.attendanceRecords} records</span>
                </div>
              </li>
            ))
          ) : (
            <li>No assigned classes yet.</li>
          )}
        </ul>
      </div>

      <div className="admin-card admin-card-summary">
        <div className="admin-card-header">
          <h3>Attendance summary</h3>
          <small>Attendance counts by status</small>
        </div>
        {attendance.length > 0 ? (
          <ul className="admin-status-list">
            {attendance.map((entry) => (
              <li key={entry.status}>
                <strong>{entry.count}</strong>
                <span>{entry.status.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No attendance data yet.</p>
        )}
      </div>

      <div className="admin-card admin-card-summary">
        <div className="admin-card-header">
          <h3>Learner progress</h3>
          <small>Average completion across your classes</small>
        </div>
        {progress ? (
          <dl className="admin-summary-list">
            <div>
              <dt>Average progress</dt>
              <dd>{progress.averageProgress}%</dd>
            </div>
            <div>
              <dt>Enrolled learners</dt>
              <dd>{progress.totalEnrollments}</dd>
            </div>
          </dl>
        ) : (
          <p>Loading progress metrics…</p>
        )}
      </div>

      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Pending assignments</h3>
          <small>Recent submissions to review</small>
        </div>
        <ul className="admin-list">
          {submissions.length > 0 ? (
            submissions.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.assignmentTitle}</strong>
                  <small>{item.studentName}</small>
                </div>
                <div>
                  <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
                  <small>{item.status}</small>
                </div>
              </li>
            ))
          ) : (
            <li>No pending submissions.</li>
          )}
        </ul>
      </div>

      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Upcoming sessions</h3>
          <small>Your next class meetings</small>
        </div>
        <ul className="admin-list">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <li key={session.id}>
                <div>
                  <strong>{session.title}</strong>
                  <small>{session.courseCode} • {session.courseTitle}</small>
                </div>
                <div>
                  <span>{session.startsAt ? new Date(session.startsAt).toLocaleDateString() : "TBD"}</span>
                  <small>{session.students} students</small>
                </div>
              </li>
            ))
          ) : (
            <li>No upcoming sessions.</li>
          )}
        </ul>
      </div>
    </section>
  );
}

function StudentDashboardPanels({ liveStats }: { liveStats: DashboardPublicStats | null }) {
  const enrolled = liveStats?.enrolledCourses ?? [];
  const nextLesson = liveStats?.nextLesson;
  const pending = liveStats?.pendingAssignments ?? [];
  const comps = liveStats?.upcomingCompetitions ?? [];
  const certificates = liveStats?.certificates ?? [];
  const player = liveStats?.playerStats;

  return (
    <section className="student-dashboard-grid">
      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Enrolled courses</h3>
          <small>Your current courses and progress</small>
        </div>
        <ul className="admin-list">
          {enrolled.length > 0 ? (
            enrolled.map((c) => (
              <li key={c.courseId}>
                <div>
                  <strong>{c.title}</strong>
                  <small>{c.code}</small>
                </div>
                <div className="admin-badges">
                  <span>{c.progress}%</span>
                  <span>{new Date(c.enrolledAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))
          ) : (
            <li>Not enrolled in any courses yet.</li>
          )}
        </ul>
      </div>

      <div className="admin-card admin-card-summary">
        <div className="admin-card-header">
          <h3>Progress & points</h3>
          <small>Your rank, points, and streak</small>
        </div>
        <dl className="admin-summary-list">
          <div>
            <dt>Points</dt>
            <dd>{player ? player.points : "—"}</dd>
          </div>
          <div>
            <dt>Streak</dt>
            <dd>{player ? `${player.streak} days` : "—"}</dd>
          </div>
          <div>
            <dt>Level</dt>
            <dd>{player ? player.level : "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="admin-card admin-card-summary">
        <div className="admin-card-header">
          <h3>Next lesson</h3>
          <small>Continue learning where you left off</small>
        </div>
        {nextLesson ? (
          <div style={{ padding: 16 }}>
            <strong>{nextLesson.title}</strong>
            <div>
              <small>Course lesson #{nextLesson.order}</small>
            </div>
            <div style={{ marginTop: 8 }}>
              <Link to={`/learn/lesson/${nextLesson.id}`}>Continue lesson →</Link>
            </div>
          </div>
        ) : (
          <p>No upcoming lessons — check your courses.</p>
        )}
      </div>

      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Pending assignments</h3>
          <small>Assignments you haven't submitted</small>
        </div>
        <ul className="admin-list">
          {pending.length > 0 ? (
            pending.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.title}</strong>
                  <small>{a.course?.title}</small>
                </div>
                <div>
                  <span>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No due date"}</span>
                </div>
              </li>
            ))
          ) : (
            <li>No pending assignments.</li>
          )}
        </ul>
      </div>

      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Upcoming competitions</h3>
          <small>Competitions you can join</small>
        </div>
        <ul className="admin-list">
          {comps.length > 0 ? (
            comps.map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{c.title}</strong>
                  <small>{c.mode} • {c.status}</small>
                </div>
                <div>
                  <span>{c.startsAt ? new Date(c.startsAt).toLocaleDateString() : "TBD"}</span>
                </div>
              </li>
            ))
          ) : (
            <li>No upcoming competitions.</li>
          )}
        </ul>
      </div>

      <div className="admin-card admin-card-list">
        <div className="admin-card-header">
          <h3>Certificates</h3>
          <small>Your earned certificates</small>
        </div>
        <ul className="admin-list">
          {certificates.length > 0 ? (
            certificates.map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{c.title}</strong>
                  <small>{c.course?.title ?? "General"}</small>
                </div>
                <div>
                  <span>{new Date(c.issuedAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))
          ) : (
            <li>No certificates yet.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
