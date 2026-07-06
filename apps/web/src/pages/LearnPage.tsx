import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  Loader2,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PaymentGate } from "../components/PaymentGate";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { learnApi, type LearnFeed } from "../lib/learn-api";
import { DELIVERY_MODE_LABELS } from "../types/course";

function formatDueDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Overdue", urgent: true };
  if (diffDays === 0) return { label: "Due today", urgent: true };
  if (diffDays === 1) return { label: "Due tomorrow", urgent: true };
  return { label: `Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`, urgent: false };
}

function formatClassDate(value?: string | null) {
  if (!value) return "Ongoing";
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LearnPage() {
  const { token } = useAuth();
  const [feed, setFeed] = useState<LearnFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await learnApi.getFeed(token);
      setFeed(data);
    } catch {
      setError("Could not load your learning feed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 size={22} className="spin" />
        Loading your learning feed…
      </div>
    );
  }

  if (error || !feed) {
    return (
      <section className="module-page">
        <p className="form-error">{error || "Something went wrong."}</p>
      </section>
    );
  }

  const { continueCourse, enrollments, stats, pendingAssignments, assessments, upcomingClasses } = feed;

  return (
    <section className="module-page learn-page">
      <SectionHeading eyebrow="Learning system" title="Your learning feed" />

      {/* ── Stats strip ── */}
      <div className="learn-stats-strip">
        <div className="learn-stat">
          <GraduationCap size={18} />
          <div>
            <strong>{stats.totalEnrolled}</strong>
            <span>Enrolled</span>
          </div>
        </div>
        <div className="learn-stat">
          <PlayCircle size={18} />
          <div>
            <strong>{stats.inProgress}</strong>
            <span>In progress</span>
          </div>
        </div>
        <div className="learn-stat">
          <CheckCircle2 size={18} />
          <div>
            <strong>{stats.completed}</strong>
            <span>Completed</span>
          </div>
        </div>
        <div className={`learn-stat ${stats.pendingWork > 0 ? "learn-stat--alert" : ""}`}>
          <AlertCircle size={18} />
          <div>
            <strong>{stats.pendingWork}</strong>
            <span>Pending work</span>
          </div>
        </div>
      </div>

      {/* ── Continue learning hero ── */}
      {continueCourse ? (
        <div className="learn-continue-card">
          <div className="learn-continue-left">
            <span className="learn-continue-eyebrow">
              {continueCourse.progress === 0 ? "Start learning" : "Continue where you left off"}
            </span>
            <h2>{continueCourse.title}</h2>
            <p>{continueCourse.description || DELIVERY_MODE_LABELS[continueCourse.deliveryMode]}</p>

            <div className="learn-continue-meta">
              <span>{continueCourse.completedLessons} / {continueCourse.totalLessons} lessons done</span>
              <span>{continueCourse.progress}% complete</span>
            </div>

            <div className="learn-continue-bar">
              <div style={{ width: `${continueCourse.progress}%` }} />
            </div>

            {continueCourse.nextLesson ? (
              continueCourse.requiresPayment ? null : (
                <Link
                  className="primary-button learn-continue-btn"
                  to={`/courses/${continueCourse.courseId}/lessons/${continueCourse.nextLesson.id}`}
                >
                  <PlayCircle size={17} />
                  {continueCourse.progress === 0 ? "Start course" : "Continue"}
                </Link>
              )
            ) : (
              <div className="learn-all-done">
                <CheckCircle2 size={16} />
                All lessons complete!
              </div>
            )}

            {continueCourse.requiresPayment && (
              <PaymentGate
                accessStatus={{ allowed: false, reason: "payment_required" }}
              />
            )}
          </div>

          <div className="learn-continue-right">
            <span className="course-code">{continueCourse.code}</span>
            <div className="learn-big-progress">
              <svg viewBox="0 0 36 36" className="learn-progress-ring">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#d8ff78"
                  strokeWidth="3"
                  strokeDasharray={`${continueCourse.progress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span>{continueCourse.progress}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="learn-empty-hero">
          <BookOpen size={44} />
          <h2>No courses enrolled yet</h2>
          <p>Browse available courses and start your GIS learning journey.</p>
          <Link className="primary-button" to="/courses">
            Browse courses <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* ── Three-column feed ── */}
      <div className="learn-feed-grid">

        {/* Enrolled courses */}
        <section className="learn-feed-section">
          <SectionHeading eyebrow="Progress tracker" title="My courses" compact />
          {enrollments.length === 0 ? (
            <div className="learn-feed-empty">
              <GraduationCap size={28} />
              <p>No enrollments yet.</p>
            </div>
          ) : (
            <div className="learn-course-list">
              {enrollments.map((course) => (
                <article key={course.enrollmentId} className="learn-course-card">
                  <div className="learn-course-card-top">
                    <span className="course-code">{course.code}</span>
                    <span className="learn-course-progress-label">{course.progress}%</span>
                  </div>
                  <strong>{course.title}</strong>
                  <div className="progress-track learn-course-track">
                    <div style={{ width: `${course.progress}%` }} />
                  </div>
                  <div className="learn-course-card-bottom">
                    <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                    {course.nextLesson ? (
                      <Link
                        className="learn-course-open-btn"
                        to={`/courses/${course.courseId}/lessons/${course.nextLesson.id}`}
                      >
                        {course.progress === 0 ? "Start" : "Continue"}
                        <ArrowRight size={13} />
                      </Link>
                    ) : (
                      <Link className="learn-course-open-btn" to={`/courses/${course.courseId}`}>
                        Review <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Pending work */}
        <section className="learn-feed-section">
          <SectionHeading eyebrow="Action needed" title="Pending work" compact />
          {pendingAssignments.length === 0 && assessments.filter((a) => !a.attempted).length === 0 ? (
            <div className="learn-feed-empty">
              <CheckCircle2 size={28} />
              <p>You're all caught up.</p>
            </div>
          ) : (
            <div className="learn-work-list">
              {/* Pending assignments */}
              {pendingAssignments.map((assignment) => {
                const due = formatDueDate(assignment.dueDate);
                const isReturned = assignment.submission?.status === "RETURNED";
                return (
                  <article key={assignment.assignmentId} className={`learn-work-item ${due?.urgent ? "learn-work-item--urgent" : ""}`}>
                    <div className="learn-work-icon">
                      <ClipboardList size={16} />
                    </div>
                    <div className="learn-work-body">
                      <strong>{assignment.title}</strong>
                      <span>{assignment.courseCode}</span>
                      <div className="learn-work-tags">
                        {isReturned && <span className="learn-tag learn-tag--returned">Returned — resubmit</span>}
                        {due && <span className={`learn-tag ${due.urgent ? "learn-tag--urgent" : ""}`}>{due.label}</span>}
                      </div>
                    </div>
                    <Link
                      className="learn-work-btn"
                      to={`/courses/${assignment.courseId}`}
                    >
                      Go <ArrowRight size={12} />
                    </Link>
                  </article>
                );
              })}

              {/* Unattempted assessments */}
              {assessments
                .filter((a) => !a.attempted)
                .map((assessment) => (
                  <article key={assessment.assessmentId} className="learn-work-item">
                    <div className="learn-work-icon">
                      <Trophy size={16} />
                    </div>
                    <div className="learn-work-body">
                      <strong>{assessment.title}</strong>
                      <span>{assessment.course?.code ?? "Assessment"}</span>
                      <div className="learn-work-tags">
                        <span className="learn-tag">
                          <Clock size={11} />{assessment.durationMin} min
                        </span>
                        <span className="learn-tag">{assessment.questionCount} questions</span>
                      </div>
                    </div>
                    <Link
                      className="learn-work-btn"
                      to={`/assessments/${assessment.assessmentId}/take`}
                    >
                      Take <ArrowRight size={12} />
                    </Link>
                  </article>
                ))}
            </div>
          )}

          {/* Attempted assessments summary */}
          {assessments.filter((a) => a.attempted).length > 0 && (
            <div className="learn-attempted-section">
              <p className="learn-attempted-label">Completed assessments</p>
              {assessments
                .filter((a) => a.attempted)
                .map((assessment) => (
                  <article key={assessment.assessmentId} className="learn-work-item learn-work-item--done">
                    <div className={`learn-work-icon ${assessment.passed ? "learn-work-icon--pass" : "learn-work-icon--fail"}`}>
                      {assessment.passed ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <div className="learn-work-body">
                      <strong>{assessment.title}</strong>
                      <span>{assessment.percentage}% — {assessment.passed ? "Passed" : "Not passed"}</span>
                    </div>
                    {assessment.latestAttemptId && (
                      <Link
                        className="learn-work-btn"
                        to={`/assessments/attempts/${assessment.latestAttemptId}`}
                      >
                        Review <ArrowRight size={12} />
                      </Link>
                    )}
                  </article>
                ))}
            </div>
          )}
        </section>

        {/* Upcoming classes */}
        <section className="learn-feed-section">
          <SectionHeading eyebrow="Schedule" title="Upcoming classes" compact />
          {upcomingClasses.length === 0 ? (
            <div className="learn-feed-empty">
              <CalendarDays size={28} />
              <p>No upcoming sessions.</p>
            </div>
          ) : (
            <div className="learn-class-list">
              {upcomingClasses.map((cls) => (
                <article key={cls.id} className="learn-class-card">
                  <div className="learn-class-icon">
                    <CalendarDays size={18} />
                  </div>
                  <div className="learn-class-body">
                    <strong>{cls.name}</strong>
                    <span>{cls.course.code} — {DELIVERY_MODE_LABELS[cls.mode]}</span>
                    <small>
                      {cls.startsAt ? formatClassDate(cls.startsAt) : "No fixed date"}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
