import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Loader2,
  PlusCircle,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { assessmentsApi } from "../lib/assessments-api";
import type {
  Assessment,
  CreateQuestionPayload,
  Question,
  QuestionType,
} from "../types/assessment";
import { QUESTION_TYPE_LABELS } from "../types/assessment";

type QuestionFormState = {
  id?: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: string;
};

const emptyQ: QuestionFormState = {
  text: "",
  type: "MCQ",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
  points: "1",
};

function toPayload(f: QuestionFormState): CreateQuestionPayload {
  const options =
    f.type === "MCQ" ? f.options.map((o) => o.trim()).filter(Boolean) : [];
  return {
    text: f.text,
    type: f.type,
    options,
    correctAnswer: f.correctAnswer || undefined,
    explanation: f.explanation || undefined,
    points: Number(f.points),
  };
}

export function AssessmentBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Settings inline edit
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ title: "", description: "", durationMin: "30", passMark: "50" });
  const [savingMeta, setSavingMeta] = useState(false);

  // Question form
  const [showQForm, setShowQForm] = useState(false);
  const [qForm, setQForm] = useState<QuestionFormState>(emptyQ);
  const [savingQ, setSavingQ] = useState(false);
  const [qError, setQError] = useState("");

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setPageError("");
    try {
      const data = await assessmentsApi.get(token, id);
      setAssessment(data);
      setMetaForm({
        title: data.title,
        description: data.description ?? "",
        durationMin: String(data.durationMin),
        passMark: String(data.passMark),
      });
    } catch {
      setPageError("Could not load assessment.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { void load(); }, [load]);

  async function saveMeta(e: FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setSavingMeta(true);
    try {
      const updated = await assessmentsApi.update(token, id, {
        title: metaForm.title,
        description: metaForm.description || undefined,
        durationMin: Number(metaForm.durationMin),
        passMark: Number(metaForm.passMark),
      });
      setAssessment(updated);
      setEditingMeta(false);
    } finally {
      setSavingMeta(false);
    }
  }

  async function togglePublish() {
    if (!token || !id || !assessment) return;
    const updated = await assessmentsApi.update(token, id, {
      isPublished: !assessment.isPublished,
    });
    setAssessment(updated);
  }

  function openAddQuestion() {
    setQForm(emptyQ);
    setQError("");
    setShowQForm(true);
  }

  function openEditQuestion(q: Question) {
    setQForm({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.type === "MCQ" ? [...q.options, "", "", ""].slice(0, 4) : ["", "", "", ""],
      correctAnswer: q.correctAnswer ?? "",
      explanation: q.explanation ?? "",
      points: String(q.points),
    });
    setQError("");
    setShowQForm(true);
  }

  async function saveQuestion(e: FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setSavingQ(true);
    setQError("");
    try {
      if (qForm.id) {
        const updated = await assessmentsApi.updateQuestion(token, qForm.id, toPayload(qForm));
        setAssessment((prev) =>
          prev
            ? {
                ...prev,
                questions: (prev.questions ?? []).map((q) =>
                  q.id === updated.id ? updated : q,
                ),
              }
            : prev,
        );
      } else {
        const created = await assessmentsApi.addQuestion(token, id, toPayload(qForm));
        setAssessment((prev) =>
          prev ? { ...prev, questions: [...(prev.questions ?? []), created] } : prev,
        );
      }
      setShowQForm(false);
    } catch (err) {
      setQError(err instanceof Error ? err.message : "Failed to save question.");
    } finally {
      setSavingQ(false);
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!token) return;
    await assessmentsApi.removeQuestion(token, questionId);
    setAssessment((prev) =>
      prev
        ? { ...prev, questions: (prev.questions ?? []).filter((q) => q.id !== questionId) }
        : prev,
    );
  }

  function updateOption(index: number, value: string) {
    const opts = [...qForm.options];
    opts[index] = value;
    setQForm((prev) => ({ ...prev, options: opts }));
  }

  if (loading) {
    return (
      <div className="page-loading"><Loader2 size={22} className="spin" />Loading builder…</div>
    );
  }

  if (pageError || !assessment) {
    return (
      <section className="module-page">
        <Link className="back-link" to="/assessments"><ArrowLeft size={16} />Back</Link>
        <p className="form-error">{pageError || "Assessment not found."}</p>
      </section>
    );
  }

  const questions = assessment.questions ?? [];

  return (
    <section className="module-page">
      <Link className="back-link" to="/assessments"><ArrowLeft size={16} />Back to assessments</Link>

      {/* ── Header ── */}
      <div className="builder-hero">
        <div>
          {editingMeta ? (
            <form className="builder-meta-form" onSubmit={(e) => void saveMeta(e)}>
              <input
                value={metaForm.title}
                onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })}
                required
                placeholder="Assessment title"
              />
              <textarea
                rows={2}
                value={metaForm.description}
                onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })}
                placeholder="Description (optional)"
              />
              <div className="builder-meta-row">
                <label>
                  Duration (min)
                  <input
                    type="number" min={1} max={600}
                    value={metaForm.durationMin}
                    onChange={(e) => setMetaForm({ ...metaForm, durationMin: e.target.value })}
                  />
                </label>
                <label>
                  Pass mark (%)
                  <input
                    type="number" min={0} max={100}
                    value={metaForm.passMark}
                    onChange={(e) => setMetaForm({ ...metaForm, passMark: e.target.value })}
                  />
                </label>
              </div>
              <div className="builder-meta-actions">
                <button type="button" className="secondary-button small-button" onClick={() => setEditingMeta(false)}>Cancel</button>
                <button className="primary-button small-button" disabled={savingMeta}>
                  <Save size={14} />{savingMeta ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="builder-title">{assessment.title}</h1>
              {assessment.description ? <p className="builder-desc">{assessment.description}</p> : null}
              <div className="builder-meta-chips">
                <span>{assessment.durationMin} min</span>
                <span>Pass: {assessment.passMark}%</span>
                <span>{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
                {assessment.shuffleQuestions ? <span>Shuffled</span> : null}
              </div>
            </>
          )}
        </div>
        <div className="builder-hero-actions">
          {!editingMeta && (
            <button className="secondary-button small-button" onClick={() => setEditingMeta(true)}>
              <Edit3 size={14} />Edit settings
            </button>
          )}
          <button
            className={assessment.isPublished ? "secondary-button small-button" : "primary-button small-button"}
            onClick={() => void togglePublish()}
          >
            {assessment.isPublished ? <><XCircle size={14} />Unpublish</> : <><CheckCircle2 size={14} />Publish</>}
          </button>
        </div>
      </div>

      {/* ── Question bank ── */}
      <SectionHeading
        eyebrow="Question bank"
        title={`${questions.length} question${questions.length !== 1 ? "s" : ""}`}
        compact
        action={
          <button className="primary-button small-button" onClick={openAddQuestion}>
            <PlusCircle size={14} />Add question
          </button>
        }
      />

      {questions.length === 0 ? (
        <div className="empty-state">
          <PlusCircle size={36} />
          <strong>No questions yet</strong>
          <p>Add your first question to start building this assessment.</p>
          <button className="primary-button" onClick={openAddQuestion}><PlusCircle size={16} />Add question</button>
        </div>
      ) : (
        <div className="question-bank">
          {questions.map((q, i) => (
            <article key={q.id} className="question-bank-item">
              <div className="question-number">{i + 1}</div>
              <div className="question-body">
                <div className="question-header-row">
                  <span className="question-type-badge">{QUESTION_TYPE_LABELS[q.type]}</span>
                  <span className="question-points">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
                </div>
                <p className="question-text">{q.text}</p>
                {q.type === "MCQ" && q.options.length > 0 ? (
                  <ul className="question-options-preview">
                    {q.options.map((opt, oi) => (
                      <li key={oi} className={opt === q.correctAnswer ? "correct-option" : ""}>
                        {opt === q.correctAnswer ? <CheckCircle2 size={12} /> : null}
                        {opt}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {q.type === "TRUE_FALSE" ? (
                  <p className="question-answer-preview">
                    Answer: <strong>{q.correctAnswer === "true" ? "True" : "False"}</strong>
                  </p>
                ) : null}
                {q.explanation ? (
                  <p className="question-explanation">💡 {q.explanation}</p>
                ) : null}
              </div>
              <div className="question-actions">
                <button className="icon-button" aria-label="Edit" onClick={() => openEditQuestion(q)}><Edit3 size={15} /></button>
                <button className="icon-button danger" aria-label="Delete" onClick={() => void deleteQuestion(q.id)}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Preview link ── */}
      {questions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button
            className="secondary-button small-button"
            onClick={() => navigate(`/assessments/${assessment.id}/take`)}
          >
            Preview quiz
          </button>
        </div>
      )}

      {/* ── Question form modal ── */}
      {showQForm ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>{qForm.id ? "Edit question" : "Add question"}</h2>
              <button className="payment-banner-close" aria-label="Close" onClick={() => setShowQForm(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={(e) => void saveQuestion(e)}>
              <label>
                Question text
                <textarea rows={3} value={qForm.text} required
                  onChange={(e) => setQForm({ ...qForm, text: e.target.value })} />
              </label>

              <label>
                Type
                <select value={qForm.type}
                  onChange={(e) => setQForm({ ...qForm, type: e.target.value as QuestionType, correctAnswer: "" })}>
                  {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                    <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </label>

              {qForm.type === "MCQ" && (
                <div className="q-options-grid">
                  <label>Options (mark the correct one)</label>
                  {qForm.options.map((opt, i) => (
                    <div key={i} className="q-option-row">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={qForm.correctAnswer === opt && opt !== ""}
                        onChange={() => setQForm({ ...qForm, correctAnswer: opt })}
                        disabled={opt === ""}
                        aria-label={`Mark option ${i + 1} as correct`}
                      />
                      <input
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {qForm.type === "TRUE_FALSE" && (
                <label>
                  Correct answer
                  <select value={qForm.correctAnswer}
                    onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })}>
                    <option value="">Select…</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </label>
              )}

              {qForm.type === "SHORT_ANSWER" && (
                <label>
                  Expected answer (keyword match, optional)
                  <input value={qForm.correctAnswer}
                    onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })}
                    placeholder="Leave blank for manual grading" />
                </label>
              )}

              <label>
                Explanation (shown after submission)
                <textarea rows={2} value={qForm.explanation}
                  onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })} />
              </label>

              <label>
                Points
                <input type="number" min={1} value={qForm.points}
                  onChange={(e) => setQForm({ ...qForm, points: e.target.value })} required />
              </label>

              {qError ? <p className="form-error">{qError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowQForm(false)}>Cancel</button>
                <button className="primary-button" disabled={savingQ}>
                  {savingQ ? "Saving…" : "Save question"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
