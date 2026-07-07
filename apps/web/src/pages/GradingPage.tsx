import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import assessmentsApi from "../lib/assessments-api";
import { SectionHeading } from "../components/SectionHeading";

export default function GradingPage() {
  const { id } = useParams<{ id: string }>(); // assessment id
  const { token } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token || !id) return;
    void assessmentsApi.listAttempts(token, id).then(setAttempts).catch(() => {});
  }, [token, id]);

  async function loadAttempt(attemptId: string) {
    if (!token) return;
    const res = await assessmentsApi.getAttempt(token, attemptId);
    setSelected(res);
    setGrades({});
    setComments({});
  }

  function setGradeFor(questionId: string, value: number) {
    setGrades((s) => ({ ...s, [questionId]: value }));
  }

  function setCommentFor(questionId: string, value: string) {
    setComments((s) => ({ ...s, [questionId]: value }));
  }

  async function submitGrades(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selected) return;
    await assessmentsApi.gradeAttempt(token, selected.attemptId, grades, comments);
    // reload attempts
    if (id) {
      const list = await assessmentsApi.listAttempts(token, id);
      setAttempts(list);
    }
    setSelected(null);
  }

  async function flagSelected(reason?: string) {
    if (!token || !selected) return;
    await assessmentsApi.flagAttempt(token, selected.attemptId, reason);
    if (id) {
      const list = await assessmentsApi.listAttempts(token, id);
      setAttempts(list);
    }
    setSelected(null);
  }

  return (
    <div>
      <SectionHeading eyebrow="Grading" title={`Grade attempts for ${id}`} />
      <section className="content-grid">
        <div className="workstream">
          <div className="admin-card admin-card-list">
            <div className="admin-card-header"><h3>Attempts</h3></div>
            <ul className="admin-list">
              {attempts.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.user?.fullName ?? a.userId}</strong>
                    <small>{a.startedAt ? new Date(a.startedAt).toLocaleString() : ""}</small>
                  </div>
                  <div>
                    <button className="text-button" onClick={() => void loadAttempt(a.id)}>View →</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {selected && (
            <div className="admin-card admin-card-summary">
              <div className="admin-card-header"><h3>Attempt</h3></div>
              <div style={{ padding: 12 }}>
                <strong>Score: {selected.score ?? "—"} / {selected.maxScore ?? "—"}</strong>
                <form onSubmit={submitGrades} style={{ marginTop: 12 }}>
                  {selected.breakdown.map((q: any) => (
                    <div key={q.questionId} style={{ marginBottom: 10 }}>
                      <div><strong>{q.text}</strong></div>
                      <div><small>Student answer: {String(q.studentAnswer ?? "-")}</small></div>
                      {!q.correct && (
                        <div>
                          <label>Assign points: </label>
                          <input type="number" min={0} max={q.points} onChange={(e) => setGradeFor(q.questionId, Number(e.target.value))} />
                          <div style={{ marginTop: 6 }}>
                            <label>Comment:</label>
                            <textarea rows={2} style={{ width: "100%", marginTop: 4 }} value={comments[q.questionId] ?? ""} onChange={(e) => setCommentFor(q.questionId, e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ marginTop: 12 }}>
                    <button className="primary-button" type="submit">Submit grades</button>
                    <button type="button" className="text-button" onClick={() => void flagSelected("Suspicious activity")}>Flag attempt</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <aside className="insight-column">
          <div className="admin-card admin-card-summary">
            <div className="admin-card-header"><h3>Guidance</h3></div>
            <div style={{ padding: 12 }}>
              <p>Use per-question grading for short answers, file uploads, and map tasks. Flag attempts that violate rules.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
