import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Edit3,
  Eye,
  Loader2,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { assignmentsApi } from "../lib/assignments-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type {
  Assignment,
  CreateAssignmentPayload,
  SubmitAssignmentPayload,
} from "../types/assignment";
import { STATUS_COLOURS, STATUS_LABELS } from "../types/assignment";
import { GradingModal } from "./GradingModal";
import { SectionHeading } from "./SectionHeading";

type Props = { courseId: string };

type AssignmentFormState = {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: string;
  isPublished: boolean;
};

const emptyForm: AssignmentFormState = {
  title: "",
  description: "",
  dueDate: "",
  maxScore: "100",
  isPublished: false,
};

function toPayload(form: AssignmentFormState): CreateAssignmentPayload {
  return {
    title: form.title,
    description: form.description || undefined,
    dueDate: form.dueDate || undefined,
    maxScore: Number(form.maxScore),
    isPublished: form.isPublished,
  };
}

export function AssignmentSection({ courseId }: Props) {
  const { token, user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AssignmentFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [gradingTarget, setGradingTarget] = useState<Assignment | null>(null);
  // Track which assignment's submission form is expanded (for students)
  const [expandedSubmit, setExpandedSubmit] = useState<string | null>(null);
  const [submitForm, setSubmitForm] = useState<SubmitAssignmentPayload>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isStaff = Boolean(user && (isAdminRole(user.role) || isInstructorRole(user.role)));

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await assignmentsApi.list(token, courseId);
      setAssignments(data);
    } catch {
      setError("Could not load assignments.");
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(assignment: Assignment) {
    setForm({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description ?? "",
      dueDate: assignment.dueDate ? assignment.dueDate.slice(0, 10) : "",
      maxScore: String(assignment.maxScore),
      isPublished: assignment.isPublished,
    });
    setShowForm(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      if (form.id) {
        const updated = await assignmentsApi.update(token, form.id, toPayload(form));
        setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await assignmentsApi.create(token, courseId, toPayload(form));
        setAssignments((prev) => [...prev, created]);
      }
      setShowForm(false);
      setForm(emptyForm);
    } catch {
      setError("Could not save assignment. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(assignmentId: string) {
    if (!token) return;
    setError("");
    try {
      await assignmentsApi.remove(token, assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch {
      setError("Could not delete assignment.");
    }
  }

  function toggleSubmitForm(assignmentId: string) {
    if (expandedSubmit === assignmentId) {
      setExpandedSubmit(null);
      setSubmitForm({});
      setSubmitError("");
    } else {
      setExpandedSubmit(assignmentId);
      setSubmitForm({});
      setSubmitError("");
    }
  }

  async function handleSubmit(assignmentId: string) {
    if (!token) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await assignmentsApi.submit(token, assignmentId, submitForm);
      // Reload to get updated mySubmission
      await load();
      setExpandedSubmit(null);
      setSubmitForm({});
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="workstream">
      <SectionHeading
        eyebrow="Coursework"
        title="Assignments"
        compact
        action={
          isStaff ? (
            <button className="primary-button small-button" onClick={startCreate}>
              <PlusCircle size={15} />
              Add assignment
            </button>
          ) : undefined
        }
      />

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? (
        <div className="inline-loader">
          <Loader2 size={18} className="spin" />
          Loading assignments…
        </div>
      ) : assignments.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={36} />
          <strong>No assignments yet</strong>
          <p>
            {isStaff
              ? "Create the first assignment for this course."
              : "Assignments will appear here once published."}
          </p>
          {isStaff ? (
            <button className="primary-button" onClick={startCreate}>
              <PlusCircle size={16} />
              Add assignment
            </button>
          ) : null}
        </div>
      ) : (
        <div className="assignment-list">
          {assignments.map((assignment) => (
            <article key={assignment.id} className="assignment-item">
              <div className="assignment-item-header">
                <div className="assignment-item-meta">
                  <h3>{assignment.title}</h3>
                  <div className="assignment-badges">
                    {isStaff && !assignment.isPublished ? (
                      <span className="assignment-badge draft">Draft</span>
                    ) : null}
                    {assignment.dueDate ? (
                      <span className="assignment-badge due">
                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    ) : null}
                    <span className="assignment-badge score">
                      {assignment.maxScore} pts
                    </span>
                    {isStaff && assignment._count !== undefined ? (
                      <span className="assignment-badge submissions">
                        {assignment._count.submissions} submission
                        {assignment._count.submissions !== 1 ? "s" : ""}
                      </span>
                    ) : null}
                    {/* Student: show their submission status */}
                    {!isStaff && (
                      <span
                        className={`assignment-badge ${
                          assignment.mySubmission
                            ? STATUS_COLOURS[assignment.mySubmission.status]
                            : "status-pending"
                        }`}
                      >
                        {assignment.mySubmission
                          ? STATUS_LABELS[assignment.mySubmission.status]
                          : STATUS_LABELS["PENDING"]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="assignment-item-actions">
                  {isStaff ? (
                    <>
                      <button
                        className="icon-button"
                        aria-label="View submissions"
                        title="View submissions"
                        onClick={() => setGradingTarget(assignment)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Edit assignment"
                        onClick={() => startEdit(assignment)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label="Delete assignment"
                        onClick={() => void handleDelete(assignment.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    /* Student submit button — toggle inline form */
                    assignment.mySubmission?.status === "GRADED" ? (
                      <span className="assignment-graded-badge">
                        <CheckCircle2 size={14} />
                        {assignment.mySubmission.score ?? "—"} / {assignment.maxScore}
                      </span>
                    ) : (
                      <button
                        className="secondary-button small-button"
                        onClick={() => toggleSubmitForm(assignment.id)}
                        aria-expanded={expandedSubmit === assignment.id}
                      >
                        {expandedSubmit === assignment.id ? (
                          <>
                            <ChevronUp size={14} />
                            Cancel
                          </>
                        ) : assignment.mySubmission ? (
                          <>
                            <Edit3 size={14} />
                            Resubmit
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            Submit
                          </>
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>

              {assignment.description ? (
                <p className="assignment-description">{assignment.description}</p>
              ) : null}

              {/* Student: grader feedback */}
              {!isStaff && assignment.mySubmission?.feedback ? (
                <div className="assignment-feedback">
                  <strong>Feedback:</strong> {assignment.mySubmission.feedback}
                </div>
              ) : null}

              {/* Student: inline submission form */}
              {!isStaff && expandedSubmit === assignment.id ? (
                <div className="submission-inline-form">
                  {submitError ? <p className="form-error">{submitError}</p> : null}
                  <label>
                    Answer
                    <textarea
                      rows={4}
                      placeholder="Type your response here…"
                      value={submitForm.answer ?? ""}
                      onChange={(e) =>
                        setSubmitForm((prev) => ({ ...prev, answer: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    File / link URL (optional)
                    <input
                      type="url"
                      placeholder="https://…"
                      value={submitForm.fileUrl ?? ""}
                      onChange={(e) =>
                        setSubmitForm((prev) => ({ ...prev, fileUrl: e.target.value }))
                      }
                    />
                  </label>
                  <div className="submission-inline-actions">
                    <button
                      className="primary-button small-button"
                      disabled={submitting || (!submitForm.answer && !submitForm.fileUrl)}
                      onClick={() => void handleSubmit(assignment.id)}
                    >
                      {submitting ? <Loader2 size={14} className="spin" /> : null}
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {/* Assignment create / edit modal */}
      {showForm ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>{form.id ? "Edit assignment" : "Add assignment"}</h2>
              <button
                className="payment-banner-close"
                aria-label="Close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={(e) => void handleSave(e)}>
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <label>
                Due date (optional)
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </label>
              <label>
                Max score
                <input
                  type="number"
                  min={1}
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                  required
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                Publish immediately
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {/* Grading modal — staff only */}
      {gradingTarget ? (
        <GradingModal
          assignment={gradingTarget}
          onClose={() => {
            setGradingTarget(null);
            void load();
          }}
        />
      ) : null}
    </section>
  );
}
