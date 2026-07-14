import { ArrowLeft, CheckSquare, Copy, Download, Edit3, FileUp, Library, Loader2, PlusCircle, Search, Shuffle, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { assessmentsApi } from "../lib/assessments-api";
import { coursesApi } from "../lib/courses-api";
import { QUESTION_TYPE_LABELS, type CreateQuestionPayload, type Question, type QuestionType } from "../types/assessment";
import type { Course, Lesson } from "../types/course";

type QuestionBank = { id: string; title: string; description?: string | null; questions: Question[] };
type Difficulty = "EASY" | "MEDIUM" | "HARD";
type ImportIssue = { row: number; message: string };
type QuestionForm = {
  text: string; type: QuestionType; options: string; correctAnswers: string; explanation: string;
  points: string; tags: string; difficulty: Difficulty; subject: string; courseId: string; lessonId: string;
};

const libraryTypes: QuestionType[] = ["MCQ", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "NOTE"];
const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const emptyQuestion: QuestionForm = { text: "", type: "MCQ", options: "", correctAnswers: "", explanation: "", points: "1", tags: "", difficulty: "MEDIUM", subject: "", courseId: "", lessonId: "" };

function parseCsv(text: string) {
  const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(value.trim()); value = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value.trim()); if (row.some(Boolean)) rows.push(row); row = []; value = "";
    } else value += character;
  }
  row.push(value.trim()); if (row.some(Boolean)) rows.push(row); return rows;
}

function validateQuestion(input: Partial<CreateQuestionPayload>, row: number): { value?: CreateQuestionPayload; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const text = String(input.text ?? "").trim();
  const type = String(input.type ?? "MCQ").toUpperCase() as QuestionType;
  const options = Array.isArray(input.options) ? input.options.map(String).map((item) => item.trim()).filter(Boolean) : [];
  const points = Number(input.points ?? (type === "NOTE" ? 0 : 1));
  if (text.length < 3) issues.push({ row, message: "Question text must contain at least 3 characters." });
  if (!libraryTypes.includes(type)) issues.push({ row, message: `Unsupported question type: ${type}.` });
  if ((type === "MCQ" || type === "MULTIPLE_CHOICE") && options.length < 2) issues.push({ row, message: "Choice questions need at least two options." });
  if (!Number.isFinite(points) || points < 0) issues.push({ row, message: "Points must be a valid positive number." });
  if (issues.length) return { issues };
  return { issues, value: { ...input, text, type, options, points, tags: Array.isArray(input.tags) ? input.tags.map(String).filter(Boolean) : [], difficulty: difficulties.includes(input.difficulty as Difficulty) ? input.difficulty as Difficulty : "MEDIUM" } };
}

export function normalizeQuestionImport(text: string, fileName: string) {
  const values: CreateQuestionPayload[] = []; const issues: ImportIssue[] = [];
  if (fileName.toLowerCase().endsWith(".json")) {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return { values, issues: [{ row: 1, message: "The JSON file is not valid JSON." }] }; }
    if (!Array.isArray(parsed)) return { values, issues: [{ row: 1, message: "JSON must contain an array of question objects." }] };
    parsed.forEach((item, index) => { const result = validateQuestion((item ?? {}) as CreateQuestionPayload, index + 1); if (result.value) values.push(result.value); issues.push(...result.issues); });
    return { values, issues };
  }

  const rows = parseCsv(text);
  if (rows.length < 2) return { values, issues: [{ row: 1, message: "CSV must contain a header and at least one question." }] };
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  rows.slice(1).forEach((cells, rowIndex) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    const type = (record.type || "MCQ").toUpperCase() as QuestionType;
    const answers = record.correctanswer ? record.correctanswer.split("|").map((item) => item.trim()).filter(Boolean) : [];
    const result = validateQuestion({
      text: record.text, type,
      options: record.options ? record.options.split("|").map((item) => item.trim()).filter(Boolean) : [],
      correctAnswer: type === "MULTIPLE_CHOICE" ? JSON.stringify(answers) : answers[0] || undefined,
      explanation: record.explanation || undefined, points: Number(record.points || (type === "NOTE" ? 0 : 1)),
      tags: record.tags ? record.tags.split("|").map((item) => item.trim()).filter(Boolean) : [],
      difficulty: (record.difficulty || "MEDIUM").toUpperCase() as Difficulty,
      subject: record.subject || undefined, courseId: record.courseid || undefined, lessonId: record.lessonid || undefined,
    }, rowIndex + 2);
    if (result.value) values.push(result.value); issues.push(...result.issues);
  });
  return { values, issues };
}

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}

export default function QuestionBankPage() {
  const { token } = useAuth(); const navigate = useNavigate(); const [params] = useSearchParams();
  const assessmentId = params.get("assessmentId") || ""; const fileInput = useRef<HTMLInputElement>(null);
  const [banks, setBanks] = useState<QuestionBank[]>([]); const [bankId, setBankId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]); const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()); const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); const [difficultyFilter, setDifficultyFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(""); const [courseFilter, setCourseFilter] = useState(""); const [lessonFilter, setLessonFilter] = useState(""); const [tagFilter, setTagFilter] = useState("");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([]); const [showBankForm, setShowBankForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false); const [editingId, setEditingId] = useState("");
  const [bankTitle, setBankTitle] = useState(""); const [bankDescription, setBankDescription] = useState(""); const [question, setQuestion] = useState<QuestionForm>(emptyQuestion);

  async function load(preferredBankId?: string) {
    if (!token) return; setLoading(true);
    try { const list = await assessmentsApi.listBanks(token) as QuestionBank[]; setBanks(list); setBankId((current) => preferredBankId || current || list[0]?.id || ""); }
    catch { setMessage("Could not load the question library."); } finally { setLoading(false); }
  }

  useEffect(() => { void load(); if (token) coursesApi.list(token, { limit: 100 }).then((result) => setCourses(result.data)).catch(() => setCourses([])); }, [token]);
  useEffect(() => { const courseId = question.courseId || courseFilter; if (!token || !courseId) { setLessons([]); return; } coursesApi.listLessons(token, courseId).then(setLessons).catch(() => setLessons([])); }, [token, question.courseId, courseFilter]);

  const activeBank = banks.find((bank) => bank.id === bankId) ?? null;
  const subjects = useMemo(() => Array.from(new Set((activeBank?.questions ?? []).map((item) => item.subject).filter(Boolean) as string[])).sort(), [activeBank]);
  const tags = useMemo(() => Array.from(new Set((activeBank?.questions ?? []).flatMap((item) => item.tags ?? []))).sort(), [activeBank]);
  const visibleQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (activeBank?.questions ?? []).filter((item) =>
      (!term || item.text.toLowerCase().includes(term) || QUESTION_TYPE_LABELS[item.type].toLowerCase().includes(term)) &&
      (!typeFilter || item.type === typeFilter) && (!difficultyFilter || item.difficulty === difficultyFilter) &&
      (!subjectFilter || item.subject === subjectFilter) && (!courseFilter || item.courseId === courseFilter) &&
      (!lessonFilter || item.lessonId === lessonFilter) && (!tagFilter || item.tags?.includes(tagFilter)));
  }, [activeBank, search, typeFilter, difficultyFilter, subjectFilter, courseFilter, lessonFilter, tagFilter]);

  async function createBank(event: React.FormEvent) { event.preventDefault(); if (!token) return; setSaving(true); try { const created = await assessmentsApi.createBank(token, bankTitle.trim(), bankDescription.trim() || undefined) as { id: string }; setBankTitle(""); setBankDescription(""); setShowBankForm(false); await load(created.id); setMessage("Question bank created."); } catch { setMessage("Could not create the question bank."); } finally { setSaving(false); } }
  function buildPayload(): CreateQuestionPayload { const answers = question.correctAnswers.split("\n").map((item) => item.trim()).filter(Boolean); return { text: question.text.trim(), type: question.type, options: question.options.split("\n").map((item) => item.trim()).filter(Boolean), correctAnswer: question.type === "MULTIPLE_CHOICE" ? JSON.stringify(answers) : answers[0] || undefined, explanation: question.explanation.trim() || undefined, points: question.type === "NOTE" ? 0 : Number(question.points || 1), tags: question.tags.split(",").map((item) => item.trim()).filter(Boolean), difficulty: question.difficulty, subject: question.subject.trim() || undefined, courseId: question.courseId || undefined, lessonId: question.lessonId || undefined }; }
  function openCreate() { setEditingId(""); setQuestion(emptyQuestion); setShowQuestionForm(true); }
  function openEdit(item: Question) { let answers = item.correctAnswer ?? ""; if (item.type === "MULTIPLE_CHOICE") { try { answers = (JSON.parse(answers) as string[]).join("\n"); } catch { /* retain original */ } } setEditingId(item.id); setQuestion({ text: item.text, type: item.type, options: (item.options ?? []).join("\n"), correctAnswers: answers, explanation: item.explanation ?? "", points: String(item.points), tags: (item.tags ?? []).join(", "), difficulty: item.difficulty ?? "MEDIUM", subject: item.subject ?? "", courseId: item.courseId ?? "", lessonId: item.lessonId ?? "" }); setShowQuestionForm(true); }
  async function saveQuestion(event: React.FormEvent) { event.preventDefault(); if (!token || !bankId) return; setSaving(true); try { if (editingId) await assessmentsApi.updateQuestion(token, editingId, buildPayload()); else await assessmentsApi.createBankQuestion(token, bankId, buildPayload()); setShowQuestionForm(false); await load(bankId); setMessage(editingId ? "Question updated." : "Reusable question added."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save the question."); } finally { setSaving(false); } }
  async function duplicateQuestion(id: string) { if (!token || !bankId) return; setSaving(true); try { await assessmentsApi.duplicateBankQuestion(token, bankId, id); await load(bankId); setMessage("Question duplicated."); } catch { setMessage("Could not duplicate this question."); } finally { setSaving(false); } }
  async function deleteQuestion(id: string) { if (!token || !window.confirm("Delete this reusable question? This cannot be undone.")) return; setSaving(true); try { await assessmentsApi.removeQuestion(token, id); setSelectedIds((current) => { const next = new Set(current); next.delete(id); return next; }); await load(bankId); setMessage("Question deleted."); } catch { setMessage("Could not delete this question."); } finally { setSaving(false); } }

  async function uploadQuestions(file?: File) { if (!file || !token || !bankId) return; setSaving(true); setImportIssues([]); try { const parsed = normalizeQuestionImport(await file.text(), file.name); setImportIssues(parsed.issues); let uploaded = 0; const failed = [...parsed.issues]; for (let index = 0; index < parsed.values.length; index += 1) { try { await assessmentsApi.createBankQuestion(token, bankId, parsed.values[index]); uploaded += 1; } catch (error) { failed.push({ row: index + 1, message: error instanceof Error ? error.message : "Server rejected this question." }); } } setImportIssues(failed); if (uploaded) await load(bankId); setMessage(`${uploaded} question${uploaded === 1 ? "" : "s"} uploaded${failed.length ? `; ${failed.length} row${failed.length === 1 ? "" : "s"} need attention` : ""}.`); } finally { setSaving(false); if (fileInput.current) fileInput.current.value = ""; } }
  function downloadTemplate(format: "csv" | "json") { if (format === "csv") downloadFile("question-library-template.csv", "text,type,options,correctAnswer,explanation,points,tags,difficulty,subject,courseId,lessonId\nWhat is GIS?,MCQ,Geographic Information System|Global Internet Service,Geographic Information System,GIS stores and analyses spatial data,1,GIS|Fundamentals,EASY,Introduction,,,", "text/csv"); else downloadFile("question-library-template.json", JSON.stringify([{ text: "What is GIS?", type: "MCQ", options: ["Geographic Information System", "Global Internet Service"], correctAnswer: "Geographic Information System", explanation: "GIS stores and analyses spatial data.", points: 1, tags: ["GIS", "Fundamentals"], difficulty: "EASY", subject: "Introduction", courseId: "", lessonId: "" }], null, 2), "application/json"); }
  function toggleQuestion(id: string) { setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  async function importSelected() { if (!token || !assessmentId || !selectedIds.size) return; setSaving(true); try { await assessmentsApi.importQuestions(token, assessmentId, Array.from(selectedIds)); navigate(`/assessments/${assessmentId}/build`); } catch { setMessage("Could not add the selected questions to this assessment."); setSaving(false); } }
  async function selectRandom() { if (!token || !bankId) return; const items = await assessmentsApi.drawFromBank(token, bankId, Math.min(10, activeBank?.questions.length ?? 10)) as Question[]; setSelectedIds(new Set(items.map((item) => item.id))); }
  function clearFilters() { setSearch(""); setTypeFilter(""); setDifficultyFilter(""); setSubjectFilter(""); setCourseFilter(""); setLessonFilter(""); setTagFilter(""); }

  return <section className="module-page question-library-page">
    {assessmentId ? <Link className="back-link" to={`/assessments/${assessmentId}/build`}><ArrowLeft size={16} />Back to assessment</Link> : null}
    <SectionHeading eyebrow="Reusable content" title="Question Library" action={<div className="question-library-actions"><button className="secondary-button small-button" onClick={() => setShowBankForm(true)}><Library size={15} />New bank</button><button className="primary-button small-button" disabled={!bankId} onClick={openCreate}><PlusCircle size={15} />Create question</button></div>} />
    <p className="page-intro">Create, organise, filter, upload, and reuse questions across courses and lessons.</p>
    {message ? <p className="form-info">{message}</p> : null}
    {importIssues.length ? <div className="question-import-errors" role="alert"><strong>Import issues</strong>{importIssues.map((issue, index) => <span key={`${issue.row}-${index}`}>Row {issue.row}: {issue.message}</span>)}</div> : null}

    <div className="question-library-toolbar">
      <label>Question bank<select value={bankId} onChange={(event) => { setBankId(event.target.value); setSelectedIds(new Set()); }}>{banks.map((bank) => <option value={bank.id} key={bank.id}>{bank.title} ({bank.questions.length})</option>)}</select></label>
      <label className="question-library-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions or types" /></label>
      <input ref={fileInput} hidden type="file" accept=".csv,.json" onChange={(event) => void uploadQuestions(event.target.files?.[0])} />
      <button className="secondary-button small-button" disabled={!bankId || saving} onClick={() => fileInput.current?.click()}><FileUp size={15} />Upload</button>
      <button className="secondary-button small-button" onClick={() => downloadTemplate("csv")}><Download size={15} />CSV template</button>
      <button className="secondary-button small-button" onClick={() => downloadTemplate("json")}><Download size={15} />JSON template</button>
    </div>
    <div className="question-library-filters">
      <select aria-label="Question type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">All types</option>{libraryTypes.map((type) => <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>)}</select>
      <select aria-label="Difficulty" value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)}><option value="">All difficulties</option>{difficulties.map((value) => <option key={value}>{value}</option>)}</select>
      <select aria-label="Subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="">All subjects</option>{subjects.map((value) => <option key={value}>{value}</option>)}</select>
      <select aria-label="Course" value={courseFilter} onChange={(event) => { setCourseFilter(event.target.value); setLessonFilter(""); }}><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
      <select aria-label="Lesson" value={lessonFilter} onChange={(event) => setLessonFilter(event.target.value)} disabled={!courseFilter}><option value="">All lessons</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select>
      <select aria-label="Tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}><option value="">All tags</option>{tags.map((value) => <option key={value}>{value}</option>)}</select>
      <button className="text-button" onClick={clearFilters}><X size={15} />Clear</button>
    </div>
    <div className="question-library-import-bar"><span><CheckSquare size={16} />{selectedIds.size} selected</span><button className="secondary-button small-button" disabled={!bankId || !activeBank?.questions.length} onClick={() => void selectRandom()}><Shuffle size={15} />Select random</button>{assessmentId ? <button className="primary-button small-button" disabled={!selectedIds.size || saving} onClick={() => void importSelected()}>{saving ? <Loader2 className="spin" size={15} /> : <PlusCircle size={15} />}Add to assessment</button> : <span>Open from an assessment to import selected questions.</span>}</div>

    {loading ? <div className="page-loading"><Loader2 className="spin" size={20} />Loading library...</div> : !activeBank ? <div className="empty-state"><Library size={36} /><strong>Create your first question bank</strong></div> : !visibleQuestions.length ? <div className="empty-state"><Search size={34} /><strong>No matching questions</strong><p>Clear filters or add a new reusable question.</p></div> : <div className="question-library-list">{visibleQuestions.map((item) => <article className={selectedIds.has(item.id) ? "question-library-row selected" : "question-library-row"} key={item.id}><label className="question-library-select"><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleQuestion(item.id)} /><span className="sr-only">Select question</span></label><div className="question-library-content"><span>{QUESTION_TYPE_LABELS[item.type]} · {item.difficulty} · {item.points} pt{item.points === 1 ? "" : "s"}</span><strong>{item.text}</strong><div className="question-library-meta">{item.subject ? <small>{item.subject}</small> : null}{item.course?.title ? <small>{item.course.title}</small> : null}{item.lesson?.title ? <small>{item.lesson.title}</small> : null}{item.tags?.map((tag) => <small key={tag}>#{tag}</small>)}</div>{item.explanation ? <small>{item.explanation}</small> : null}</div><div className="question-library-row-actions"><button className="icon-button" title="Edit question" aria-label="Edit question" onClick={() => openEdit(item)}><Edit3 size={16} /></button><button className="icon-button" title="Duplicate question" aria-label="Duplicate question" onClick={() => void duplicateQuestion(item.id)}><Copy size={16} /></button><button className="icon-button danger" title="Delete question" aria-label="Delete question" onClick={() => void deleteQuestion(item.id)}><Trash2 size={16} /></button></div></article>)}</div>}

    {showBankForm ? <div className="modal-backdrop" role="dialog" aria-modal="true"><section className="modal-panel"><div className="modal-header"><h2>New question bank</h2><button className="icon-button" aria-label="Close" onClick={() => setShowBankForm(false)}><X size={18} /></button></div><form className="modal-form" onSubmit={(event) => void createBank(event)}><label>Bank title<input required minLength={3} value={bankTitle} onChange={(event) => setBankTitle(event.target.value)} /></label><label>Description<textarea value={bankDescription} onChange={(event) => setBankDescription(event.target.value)} /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowBankForm(false)}>Cancel</button><button className="primary-button" disabled={saving}>Create bank</button></div></form></section></div> : null}
    {showQuestionForm ? <div className="modal-backdrop" role="dialog" aria-modal="true"><section className="modal-panel modal-panel--wide"><div className="modal-header"><h2>{editingId ? "Edit reusable question" : "Create reusable question"}</h2><button className="icon-button" aria-label="Close" onClick={() => setShowQuestionForm(false)}><X size={18} /></button></div><form className="modal-form question-editor-form" onSubmit={(event) => void saveQuestion(event)}><label className="full-span">Question or note<textarea required minLength={3} rows={3} value={question.text} onChange={(event) => setQuestion({ ...question, text: event.target.value })} /></label><label>Question type<select value={question.type} onChange={(event) => setQuestion({ ...question, type: event.target.value as QuestionType })}>{libraryTypes.map((type) => <option value={type} key={type}>{QUESTION_TYPE_LABELS[type]}</option>)}</select></label><label>Difficulty<select value={question.difficulty} onChange={(event) => setQuestion({ ...question, difficulty: event.target.value as Difficulty })}>{difficulties.map((value) => <option key={value}>{value}</option>)}</select></label><label>Subject<input value={question.subject} onChange={(event) => setQuestion({ ...question, subject: event.target.value })} /></label><label>Tags, separated by commas<input value={question.tags} onChange={(event) => setQuestion({ ...question, tags: event.target.value })} /></label><label>Course<select value={question.courseId} onChange={(event) => setQuestion({ ...question, courseId: event.target.value, lessonId: "" })}><option value="">Any course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label>Lesson<select value={question.lessonId} disabled={!question.courseId} onChange={(event) => setQuestion({ ...question, lessonId: event.target.value })}><option value="">Any lesson</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label>{question.type === "MCQ" || question.type === "MULTIPLE_CHOICE" ? <label className="full-span">Answer options, one per line<textarea required rows={5} value={question.options} onChange={(event) => setQuestion({ ...question, options: event.target.value })} /></label> : null}{question.type !== "NOTE" ? <label className="full-span">{question.type === "MULTIPLE_CHOICE" ? "Correct answers, one per line" : "Correct answer"}<textarea rows={3} value={question.correctAnswers} onChange={(event) => setQuestion({ ...question, correctAnswers: event.target.value })} /></label> : null}<label className="full-span">Explanation shown after answering<textarea rows={3} value={question.explanation} onChange={(event) => setQuestion({ ...question, explanation: event.target.value })} /></label>{question.type !== "NOTE" ? <label>Points<input type="number" min={1} value={question.points} onChange={(event) => setQuestion({ ...question, points: event.target.value })} /></label> : null}<div className="modal-actions full-span"><button type="button" className="secondary-button" onClick={() => setShowQuestionForm(false)}>Cancel</button><button className="primary-button" disabled={saving}>{editingId ? "Save changes" : "Save to library"}</button></div></form></section></div> : null}
  </section>;
}
