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
  UploadCloud,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { assignmentsApi } from "../lib/assignments-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type {
  Assignment,
  CreateAssignmentPayload,
  EvidenceFile,
  SubmitAssignmentPayload,
} from "../types/assignment";
import type { CourseModule } from "../types/curriculum";
import { STATUS_COLOURS, STATUS_LABELS } from "../types/assignment";
import { GradingModal } from "./GradingModal";
import { SectionHeading } from "./SectionHeading";

type Props = { courseId: string; modules?: CourseModule[] };

type AssignmentFormState = {
  id?: string;
  moduleId: string;
  kind: "COURSEWORK" | "MODULE_PRACTICAL" | "CAPSTONE_PROJECT";
  title: string;
  description: string;
  dueDate: string;
  maxScore: string;
  isPublished: boolean;
  acceptedEvidence: string[];
};

const emptyForm: AssignmentFormState = {
  moduleId: "",
  kind: "COURSEWORK",
  title: "",
  description: "",
  dueDate: "",
  maxScore: "100",
  isPublished: false,
  acceptedEvidence: [],
};

function toPayload(form: AssignmentFormState): CreateAssignmentPayload {
  return {
    moduleId: form.moduleId || undefined,
    kind: form.kind,
    title: form.title,
    description: form.description || undefined,
    dueDate: form.dueDate || undefined,
    maxScore: Number(form.maxScore),
    isPublished: form.isPublished,
    acceptedEvidence: form.acceptedEvidence,
  };
}

export function AssignmentSection({ courseId, modules = [] }: Props) {
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
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

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
      moduleId: assignment.moduleId ?? "",
      kind: assignment.kind ?? "COURSEWORK",
      title: assignment.title,
      description: assignment.description ?? "",
      dueDate: assignment.dueDate ? assignment.dueDate.slice(0, 10) : "",
      maxScore: String(assignment.maxScore),
      isPublished: assignment.isPublished,
      acceptedEvidence: assignment.acceptedEvidence ?? [],
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

  async function uploadEvidence(assignmentId: string, files: FileList | null) {
    if (!token || !files?.length) return;
    setUploadingEvidence(true);
    setSubmitError("");
    try {
      const uploaded: EvidenceFile[] = [];
      for (const file of Array.from(files)) {
        const result = await assignmentsApi.uploadEvidence(token, assignmentId, file);
        uploaded.push({ name: file.name, url: result.url, type: file.type || undefined });
      }
      setSubmitForm((current) => ({ ...current, evidence: [...(current.evidence ?? []), ...uploaded] }));
    } catch {
      setSubmitError("One or more evidence files could not be uploaded.");
    } finally {
      setUploadingEvidence(false);
    }
  }

  function removeEvidence(url: string) {
    setSubmitForm((current) => ({ ...current, evidence: (current.evidence ?? []).filter((item) => item.url !== url) }));
  }

  return (
    <section className="workstream" id="coursework">
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
                    {assignment.kind === "MODULE_PRACTICAL" ? <span className="assignment-badge score">Module practical</span> : null}
                    {assignment.kind === "CAPSTONE_PROJECT" ? <span className="assignment-badge due">Capstone project</span> : null}
                    {assignment.moduleId ? <span className="assignment-badge submissions">{modules.find((module) => module.id === assignment.moduleId)?.title ?? "Module"}</span> : null}
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
                  <label className="submission-evidence-picker">
                    Evidence files
                    <span>Upload images, documents, a ZIP containing shapefile components, or other project evidence.</span>
                    <span className="secondary-button small-button"><UploadCloud size={15} /> {uploadingEvidence ? "Uploading..." : "Choose files"}</span>
                    <input
                      type="file"
                      multiple
                      accept=".zip,.shp,.shx,.dbf,.prj,.geojson,.kml,.kmz,.gpkg,.tif,.tiff,.png,.jpg,.jpeg,.pdf,.doc,.docx,.ppt,.pptx"
                      disabled={uploadingEvidence}
                      onChange={(event) => {
                        void uploadEvidence(assignment.id, event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {submitForm.evidence?.length ? (
                    <div className="submission-evidence-list">
                      {submitForm.evidence.map((file) => (
                        <span key={file.url}><a href={file.url} target="_blank" rel="noreferrer">{file.name}</a><button onClick={() => removeEvidence(file.url)} aria-label={`Remove ${file.name}`}><X size={13} /></button></span>
                      ))}
                    </div>
                  ) : null}
                  <div className="submission-inline-actions">
                    <button
                      className="primary-button small-button"
                      disabled={submitting || uploadingEvidence || (!submitForm.answer && !submitForm.fileUrl && !submitForm.evidence?.length)}
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
              <div className="form-row">
                <label>
                  Activity type
                  <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as AssignmentFormState["kind"] })}>
                    <option value="COURSEWORK">Course assignment</option>
                    <option value="MODULE_PRACTICAL">End-of-module practical</option>
                    <option value="CAPSTONE_PROJECT">Course capstone project</option>
                  </select>
                </label>
                <label>
                  Module
                  <select value={form.moduleId} onChange={(event) => setForm({ ...form, moduleId: event.target.value })} required={form.kind === "MODULE_PRACTICAL"}>
                    <option value="">Whole course</option>
                    {modules.map((module) => <option value={module.id} key={module.id}>{module.order}. {module.title}</option>)}
                  </select>
                </label>
              </div>
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
              <fieldset className="evidence-options">
                <legend>Accepted evidence</legend>
                {["Shapefile / GIS archive", "Map image", "Document / report", "Presentation", "External project link"].map((option) => (
                  <label className="checkbox-label" key={option}>
                    <input
                      type="checkbox"
                      checked={form.acceptedEvidence.includes(option)}
                      onChange={(event) => setForm({
                        ...form,
                        acceptedEvidence: event.target.checked
                          ? [...form.acceptedEvidence, option]
                          : form.acceptedEvidence.filter((item) => item !== option),
                      })}
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
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
