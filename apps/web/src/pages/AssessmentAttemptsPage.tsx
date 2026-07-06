import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { assessmentsApi } from "../lib/assessments-api";
import type { Assessment, AttemptSummary } from "../types/assessment";

type StaffAttempt = AttemptSummary & {
  user?: { id: string; fullName: string; email: string };
};

export function AssessmentAttemptsPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempts, setAttempts] = useState<StaffAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError("");
    try {
      const [aData, attData] = await Promise.all([
        assessmentsApi.get(token, id),
        assessmentsApi.listAttempts(token, id),
      ]);
      setAssessment(aData);
      setAttempts(attData as StaffAttempt[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load attempts.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <div className="page-loading"><Loader2 size={22} className="spin" />Loading…</div>;
  }

  if (error || !assessment) {
    return (
      <section className="module-page">
        <Link className="back-link" to="/assessments"><ArrowLeft size={16} />Back</Link>
        <p className="form-error">{error || "Not found."}</p>
      </section>
    );
  }

  const submitted = attempts.filter((a) => a.status === "SUBMITTED");
  const avgScore = submitted.length
    ? Math.round(submitted.reduce((s, a) => s + (a.percentage ?? 0), 0) / submitted.length)
    : null;
  const passCount = submitted.filter((a) => a.passed).length;

  return (
    <section className="module-page">
      <Link className="back-link" to="/assessments"><ArrowLeft size={16} />Back to assessments</Link>

      <div className="attempts-hero">
        <h1>{assessment.title}</h1>
        <p>Pass mark: {assessment.passMark}% · {assessment.durationMin} min</p>
      </div>

      {/* Stats row */}
      <div className="attempts-stats">
        <div className="attempts-stat"><strong>{attempts.length}</strong><span>Total attempts</span></div>
        <div className="attempts-stat"><strong>{submitted.length}</strong><span>Submitted</span></div>
        <div className="attempts-stat"><strong>{passCount}</strong><span>Passed</span></div>
        <div className="attempts-stat">
          <strong>{avgScore !== null ? `${avgScore}%` : "—"}</strong>
          <span>Average score</span>
        </div>
      </div>

      {attempts.length === 0 ? (
        <p className="grading-empty">No attempts yet.</p>
      ) : (
        <div className="attempts-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Score</th>
                <th>Passed</th>
                <th>Submitted</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((att) => (
                <tr key={att.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{att.user?.fullName?.charAt(0) ?? "?"}</div>
                      <div>
                        <strong>{att.user?.fullName ?? "Unknown"}</strong>
                        <span>{att.user?.email ?? ""}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`assignment-badge ${att.status === "SUBMITTED" ? "status-graded" : "status-submitted"}`}>
                      {att.status}
                    </span>
                  </td>
                  <td>
                    {att.percentage != null
                      ? <strong>{att.percentage}%</strong>
                      : <span className="users-date-cell">—</span>}
                  </td>
                  <td>
                    {att.passed === true
                      ? <CheckCircle2 size={16} color="var(--green-700)" />
                      : att.passed === false
                      ? <XCircle size={16} color="#991b1b" />
                      : <span className="users-date-cell">—</span>}
                  </td>
                  <td className="users-date-cell">
                    {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : "—"}
                  </td>
                  <td>
                    {att.status === "SUBMITTED" && (
                      <Link className="secondary-button small-button" to={`/assessments/attempts/${att.id}`}>
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
