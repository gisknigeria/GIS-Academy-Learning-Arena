import { CheckCircle2, Clock, ClipboardList, Library, Loader2, PlusCircle, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { assessmentsApi } from "../lib/assessments-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type { Assessment, AttemptSummary } from "../types/assessment";

export function AssessmentsPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isStaff = Boolean(user && (isAdminRole(user.role) || isInstructorRole(user.role)));

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [myAttempts, setMyAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Staff: create new assessment state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [aData, attempts] = await Promise.all([
        assessmentsApi.list(token, isStaff),
        isStaff ? Promise.resolve([]) : assessmentsApi.getMyAttempts(token),
      ]);
      setAssessments(aData);
      setMyAttempts(attempts);
    } catch {
      setError("Could not load assessments.");
    } finally {
      setLoading(false);
    }
  }, [token, isStaff]);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setCreateError("");
    try {
      const created = await assessmentsApi.create(token, {
        title: newTitle,
        durationMin: Number(newDuration),
      });
      navigate(`/assessments/${created.id}/build`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setCreating(false);
    }
  }

  // Helper: find user's best attempt for an assessment
  function bestAttempt(assessmentId: string): AttemptSummary | null {
    const relevant = myAttempts.filter(
      (a) => a.assessmentId === assessmentId && a.status === "SUBMITTED",
    );
    if (relevant.length === 0) return null;
    return relevant.reduce((best, cur) =>
      (cur.percentage ?? 0) > (best.percentage ?? 0) ? cur : best,
    );
  }

  return (
    <section className="module-page">
      <SectionHeading
        eyebrow="Assessment engine"
        title="Tests and quizzes"
        action={
          isStaff ? (
            <div className="question-library-actions">
              <Link className="secondary-button small-button" to="/assessments/banks"><Library size={15} />Question Library</Link>
              <button className="primary-button small-button" onClick={() => setShowCreate(true)}>
                <PlusCircle size={15} />New assessment
              </button>
            </div>
          ) : undefined
        }
      />

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? (
        <div className="page-loading"><Loader2 size={22} className="spin" />Loading…</div>
      ) : assessments.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={40} />
          <strong>No assessments yet</strong>
          <p>{isStaff ? "Create your first assessment." : "No assessments are published yet."}</p>
          {isStaff && (
            <button className="primary-button" onClick={() => setShowCreate(true)}>
              <PlusCircle size={16} />New assessment
            </button>
          )}
        </div>
      ) : (
        <div className="assessment-list">
          {assessments.map((a) => {
            const attempt = isStaff ? null : bestAttempt(a.id);
            return (
              <article key={a.id} className="assessment-card">
                <div className="assessment-card-body">
                  <div className="assessment-card-header">
                    <h3>{a.title}</h3>
                    {!a.isPublished && <span className="assignment-badge draft">Draft</span>}
                  </div>
                  {a.description ? <p className="assessment-card-desc">{a.description}</p> : null}
                  <div className="assessment-card-meta">
                    <span><Clock size={13} />{a.durationMin} min</span>
                    <span><ClipboardList size={13} />{a._count?.questions ?? 0} questions</span>
                    {isStaff && <span><Users size={13} />{a._count?.attempts ?? 0} attempts</span>}
                    {a.course && <span>📚 {a.course.code}</span>}
                  </div>
                  {/* Student: show best attempt badge */}
                  {!isStaff && attempt && (
                    <div className={`attempt-badge ${attempt.passed ? "attempt-passed" : "attempt-failed"}`}>
                      {attempt.passed ? <CheckCircle2 size={13} /> : null}
                      Best: {attempt.percentage}% · {attempt.passed ? "Passed" : "Not passed"}
                    </div>
                  )}
                </div>
                <div className="assessment-card-actions">
                  {isStaff ? (
                    <>
                      <Link className="secondary-button small-button" to={`/assessments/${a.id}/build`}>
                        Build
                      </Link>
                      <Link className="primary-button small-button" to={`/assessments/${a.id}/attempts`}>
                        Results
                      </Link>
                    </>
                  ) : (
                    <Link
                      className="primary-button small-button"
                      to={`/assessments/${a.id}/take`}
                    >
                      {attempt ? "Retake" : "Start"}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>New assessment</h2>
              <button className="payment-banner-close" aria-label="Close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={(e) => void handleCreate(e)}>
              <label>
                Title
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required minLength={3} />
              </label>
              <label>
                Duration (minutes)
                <input type="number" min={1} max={600} value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)} required />
              </label>
              {createError ? <p className="form-error">{createError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="primary-button" disabled={creating}>
                  {creating ? "Creating…" : "Create & build"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
