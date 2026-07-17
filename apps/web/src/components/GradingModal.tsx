import { ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { assignmentsApi } from "../lib/assignments-api";
import type { Assignment, GradeSubmissionPayload, Submission, SubmissionStatus } from "../types/assignment";
import { STATUS_COLOURS, STATUS_LABELS } from "../types/assignment";

type Props = {
  assignment: Assignment;
  onClose: () => void;
};

type GradeFormState = {
  score: string;
  feedback: string;
  status: SubmissionStatus;
};

export function GradingModal({ assignment, onClose }: Props) {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [grading, setGrading] = useState<string | null>(null); // submissionId being graded
  const [gradeForm, setGradeForm] = useState<GradeFormState>({
    score: "",
    feedback: "",
    status: "GRADED",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await assignmentsApi.listSubmissions(token, assignment.id);
      setSubmissions(data);
    } catch {
      setError("Could not load submissions.");
    } finally {
      setLoading(false);
    }
  }, [assignment.id, token]);

  useEffect(() => {
    void load();
  }, [load]);

  function openGradeForm(submission: Submission) {
    setGrading(submission.id);
    setGradeForm({
      score: submission.score != null ? String(submission.score) : "",
      feedback: submission.feedback ?? "",
      status: (submission.status === "SUBMITTED" || submission.status === "RETURNED")
        ? "GRADED"
        : submission.status,
    });
    setSaveError("");
  }

  async function handleGrade() {
    if (!token || !grading) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload: GradeSubmissionPayload = {
        status: gradeForm.status,
        feedback: gradeForm.feedback || undefined,
        score: gradeForm.score !== "" ? Number(gradeForm.score) : undefined,
      };
      const updated = await assignmentsApi.grade(token, grading, payload);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      setGrading(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Grading failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel modal-panel--wide">
        <div className="modal-header">
          <div>
            <h2>Submissions</h2>
            <p className="modal-subtitle">{assignment.title}</p>
          </div>
          <button className="payment-banner-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        {loading ? (
          <div className="inline-loader">
            <Loader2 size={18} className="spin" />
            Loading submissions…
          </div>
        ) : submissions.length === 0 ? (
          <p className="grading-empty">No submissions yet.</p>
        ) : (
          <div className="submissions-list">
            {submissions.map((sub) => (
              <article key={sub.id} className="submission-item">
                <div className="submission-item-header">
                  <div>
                    <strong>{sub.student.fullName}</strong>
                    <span className="submission-email">{sub.student.email}</span>
                  </div>
                  <div className="submission-item-right">
                    <span className={`assignment-badge ${STATUS_COLOURS[sub.status]}`}>
                      {STATUS_LABELS[sub.status]}
                    </span>
                    {sub.score != null ? (
                      <span className="submission-score">
                        {sub.score} / {assignment.maxScore}
                      </span>
                    ) : null}
                    <button
                      className="secondary-button small-button"
                      onClick={() => openGradeForm(sub)}
                    >
                      Grade
                    </button>
                  </div>
                </div>

                {sub.answer ? (
                  <p className="submission-answer">{sub.answer}</p>
                ) : null}
                {sub.fileUrl ? (
                  <a
                    className="submission-file-link"
                    href={sub.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={13} />
                    Open submission file
                  </a>
                ) : null}
                {sub.evidence?.length ? (
                  <div className="submission-evidence-links">
                    {sub.evidence.map((file) => (
                      <a className="submission-file-link" href={file.url} target="_blank" rel="noreferrer" key={file.url}>
                        <ExternalLink size={13} />
                        {file.name}
                      </a>
                    ))}
                  </div>
                ) : null}
                {sub.feedback ? (
                  <p className="submission-feedback">
                    <strong>Feedback:</strong> {sub.feedback}
                  </p>
                ) : null}

                {/* Inline grade form for this submission */}
                {grading === sub.id ? (
                  <div className="grade-form">
                    {saveError ? <p className="form-error">{saveError}</p> : null}
                    <div className="grade-form-row">
                      <label>
                        Score (/ {assignment.maxScore})
                        <input
                          type="number"
                          min={0}
                          max={assignment.maxScore}
                          value={gradeForm.score}
                          onChange={(e) =>
                            setGradeForm((prev) => ({ ...prev, score: e.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Status
                        <select
                          value={gradeForm.status}
                          onChange={(e) =>
                            setGradeForm((prev) => ({
                              ...prev,
                              status: e.target.value as SubmissionStatus,
                            }))
                          }
                        >
                          <option value="SUBMITTED">Submitted</option>
                          <option value="GRADED">Graded</option>
                          <option value="RETURNED">Returned</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Feedback
                      <textarea
                        rows={3}
                        value={gradeForm.feedback}
                        onChange={(e) =>
                          setGradeForm((prev) => ({ ...prev, feedback: e.target.value }))
                        }
                      />
                    </label>
                    <div className="grade-form-actions">
                      <button
                        className="secondary-button small-button"
                        onClick={() => setGrading(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="primary-button small-button"
                        disabled={saving}
                        onClick={() => void handleGrade()}
                      >
                        {saving ? <Loader2 size={13} className="spin" /> : null}
                        {saving ? "Saving…" : "Save grade"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
