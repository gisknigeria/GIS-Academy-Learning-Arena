import {
  Award,
  BarChart3,
  BookOpenCheck,
  FileText,
  Loader2,
  Medal,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { COMPETITION_MODE_LABELS, COMPETITION_STATUS_LABELS } from "../types/competition";
import { DELIVERY_MODE_LABELS } from "../types/course";
import type {
  CertificateReports,
  CompetitionReports,
  CourseReport,
  LearnerReport,
  ReportsOverview,
} from "../types/report";
import { reportsApi } from "../lib/reports-api";

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <article className="report-stat-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function ReportsPage() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [courses, setCourses] = useState<CourseReport[]>([]);
  const [learners, setLearners] = useState<LearnerReport[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionReports | null>(null);
  const [certificates, setCertificates] = useState<CertificateReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [overviewData, courseData, learnerData, competitionData, certificateData] =
        await Promise.all([
          reportsApi.overview(token),
          reportsApi.courses(token),
          reportsApi.learners(token),
          reportsApi.competitions(token),
          reportsApi.certificates(token),
        ]);

      setOverview(overviewData);
      setCourses(courseData);
      setLearners(learnerData);
      setCompetitions(competitionData);
      setCertificates(certificateData);
    } catch {
      setError("Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return (
    <section className="module-page reports-page">
      <SectionHeading
        eyebrow="Analytics"
        title="Performance intelligence and reports"
        action={
          <button className="secondary-button small-button" onClick={() => void loadReports()}>
            Refresh
          </button>
        }
      />

      {loading ? (
        <div className="page-loading">
          <Loader2 size={22} className="spin" />
          Loading reports...
        </div>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : overview ? (
        <>
          <div className="report-stat-grid">
            <StatCard
              icon={Users}
              label="Learners"
              value={overview.learners}
              note={`${overview.paidLearners} paid learners`}
            />
            <StatCard
              icon={BookOpenCheck}
              label="Course progress"
              value={`${overview.averageProgress}%`}
              note={`${overview.lessonCompletions} completed lessons`}
            />
            <StatCard
              icon={FileText}
              label="Assessments"
              value={overview.assessments}
              note={`${overview.submittedAttempts} submitted attempts`}
            />
            <StatCard
              icon={Trophy}
              label="Arena"
              value={overview.competitions}
              note={`${overview.participants} competition joins`}
            />
            <StatCard
              icon={Award}
              label="Certificates"
              value={overview.certificates}
              note="Issued and verifiable"
            />
            <StatCard
              icon={TrendingUp}
              label="Submissions"
              value={overview.submissions}
              note={`${overview.assignments} assignments created`}
            />
          </div>

          <div className="reports-layout">
            <section className="report-panel report-panel-wide">
              <div className="report-panel-header">
                <div>
                  <span>Courses</span>
                  <h3>Enrollment and completion health</h3>
                </div>
              </div>
              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Mode</th>
                      <th>Lessons</th>
                      <th>Enrollments</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td>
                          <strong>{course.title}</strong>
                          <span>{course.code}</span>
                        </td>
                        <td>{DELIVERY_MODE_LABELS[course.deliveryMode]}</td>
                        <td>{course.lessons}</td>
                        <td>{course.enrollments}</td>
                        <td>
                          <div className="report-progress-cell">
                            <span>{course.averageProgress}%</span>
                            <div>
                              <i style={{ width: `${course.averageProgress}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-panel">
              <div className="report-panel-header">
                <div>
                  <span>Leaderboard</span>
                  <h3>Top arena players</h3>
                </div>
                <Medal size={20} />
              </div>
              <div className="report-list">
                {(competitions?.topParticipants ?? []).length === 0 ? (
                  <p className="report-empty">No arena scores yet.</p>
                ) : (
                  competitions?.topParticipants.map((entry) => (
                    <article className="report-list-item" key={`${entry.competition.id}-${entry.user.id}`}>
                      <strong>#{entry.rank} {entry.user.fullName}</strong>
                      <span>{entry.competition.title}</span>
                      <b>{entry.score} pts</b>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="reports-layout">
            <section className="report-panel">
              <div className="report-panel-header">
                <div>
                  <span>Learners</span>
                  <h3>Recent learner performance</h3>
                </div>
              </div>
              <div className="report-list">
                {learners.slice(0, 8).map((learner) => (
                  <article className="report-list-item" key={learner.id}>
                    <strong>{learner.fullName}</strong>
                    <span>
                      {learner.enrollments} courses | {learner.completedLessons} lessons | {learner.averageProgress}%
                    </span>
                    <b>{learner.paymentStatus}</b>
                  </article>
                ))}
              </div>
            </section>

            <section className="report-panel">
              <div className="report-panel-header">
                <div>
                  <span>Competitions</span>
                  <h3>Arena operations</h3>
                </div>
              </div>
              <div className="report-list">
                {(competitions?.competitions ?? []).slice(0, 8).map((competition) => (
                  <article className="report-list-item" key={competition.id}>
                    <strong>{competition.title}</strong>
                    <span>
                      {COMPETITION_MODE_LABELS[competition.mode]} | {formatDate(competition.startsAt)}
                    </span>
                    <b>{COMPETITION_STATUS_LABELS[competition.status]}</b>
                  </article>
                ))}
              </div>
            </section>

            <section className="report-panel">
              <div className="report-panel-header">
                <div>
                  <span>Certificates</span>
                  <h3>Recent recognition</h3>
                </div>
              </div>
              <div className="report-list">
                {(certificates?.recent ?? []).length === 0 ? (
                  <p className="report-empty">No certificates issued yet.</p>
                ) : (
                  certificates?.recent.slice(0, 8).map((certificate) => (
                    <article className="report-list-item" key={certificate.id}>
                      <strong>{certificate.title}</strong>
                      <span>{certificate.user?.fullName ?? "Learner"} | {formatDate(certificate.issuedAt)}</span>
                      <b>{certificate.certificateNo}</b>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
