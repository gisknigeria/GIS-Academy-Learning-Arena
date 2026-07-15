import { ArrowLeft, BookOpen, CheckCircle2, ClipboardCheck, Edit3, ExternalLink, FileArchive, FileText, Image, Link2, Loader2, Map, PlayCircle, PlusCircle, Presentation, Search, Trophy, Trash2, UploadCloud, Video, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AssignmentSection } from "../components/AssignmentSection";
import { PaymentGate } from "../components/PaymentGate";
import { PresentationDeckBuilder } from "../components/PresentationDeckBuilder";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { coursesApi } from "../lib/courses-api";
import { assessmentsApi } from "../lib/assessments-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type { Course, CourseProgress, CreateLessonPayload, Lesson, LessonAttachment, LessonLibraryItem } from "../types/course";
import { DELIVERY_MODE_LABELS } from "../types/course";

type LessonFormState = {
  id?: string;
  title: string;
  summary: string;
  content: string;
  order: string;
  videoUrl: string;
  resourceUrl: string;
  subtitleUrl: string;
  slideUrl: string;
  mapUrl: string;
  attachments: LessonAttachment[];
};

const emptyForm: LessonFormState = {
  title: "",
  summary: "",
  content: "",
  order: "1",
  videoUrl: "",
  resourceUrl: "",
  subtitleUrl: "",
  slideUrl: "",
  mapUrl: "",
  attachments: [],
};

function toLessonPayload(form: LessonFormState): CreateLessonPayload {
  return {
    title: form.title.trim(),
    summary: form.summary.trim() || undefined,
    content: form.content.trim() || undefined,
    order: Number(form.order),
    videoUrl: form.videoUrl.trim() || undefined,
    resourceUrl: form.resourceUrl.trim() || undefined,
    subtitleUrl: form.subtitleUrl.trim() || undefined,
    slideUrl: form.slideUrl.trim() || undefined,
    mapUrl: form.mapUrl.trim() || undefined,
    attachments: form.attachments,
  };
}

function getMaterialType(nameOrUrl: string, mimeType?: string) {
  const text = `${nameOrUrl} ${mimeType ?? ""}`.toLowerCase();
  if (text.includes("video/") || /\.(mp4|webm|mov|m4v|avi|mkv)(\?|$)/.test(text)) return "Video";
  if (text.includes("pdf") || /\.pdf(\?|$)/.test(text)) return "PDF";
  if (text.includes("presentation") || /\.(ppt|pptx)(\?|$)/.test(text)) return "PowerPoint";
  if (text.includes("image/") || /\.(png|jpe?g|gif|webp|svg)(\?|$)/.test(text)) return "Image";
  if (/\.(zip|shp|shx|dbf|prj|geojson|kml|kmz|gpkg|tif|tiff)(\?|$)/.test(text)) return "GIS / Map";
  if (/\.(vtt|srt)(\?|$)/.test(text)) return "Subtitle";
  if (/\.(doc|docx|xls|xlsx|csv|txt)(\?|$)/.test(text)) return "Document";
  return "File";
}

function MaterialIcon({ type }: { type: string }) {
  if (type === "Video") return <Video size={14} />;
  if (type === "PowerPoint") return <Presentation size={14} />;
  if (type === "PDF" || type === "Document" || type === "Subtitle") return <FileText size={14} />;
  if (type === "Image") return <Image size={14} />;
  if (type === "GIS / Map") return <Map size={14} />;
  return <FileArchive size={14} />;
}

function getMaterialDisplayName(value: string) {
  try {
    const pathname = new URL(value, "https://material.local").pathname;
    const filename = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "Learning material");
    return filename.replace(/^\d+-/, "") || "Learning material";
  } catch {
    return value;
  }
}

function MaterialChip({ href, label, type }: { href: string; label: string; type: string }) {
  return (
    <a className="material-chip" href={href} target="_blank" rel="noreferrer" title={label}>
      <MaterialIcon type={type} />
      <span>{type}</span>
    </a>
  );
}

function MaterialField({
  type,
  label,
  value,
  uploading,
  hint,
  accept,
  onUrlChange,
  onFileChange,
  onClear,
}: {
  type: string;
  label: string;
  value: string;
  uploading: boolean;
  hint?: string;
  accept?: string;
  onUrlChange: (value: string) => void;
  onFileChange: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className={value ? "lesson-material-field has-material" : "lesson-material-field"}>
      <div className="lesson-material-field-heading">
        <span className="lesson-material-field-icon"><MaterialIcon type={type} /></span>
        <div>
          <strong>{label}</strong>
          <span>{value ? "Material added" : "Optional"}</span>
        </div>
        {value ? <CheckCircle2 size={18} className="lesson-material-check" /> : null}
      </div>

      {value ? (
        <div className="lesson-material-current">
          <MaterialIcon type={getMaterialType(value)} />
          <div>
            <strong>{getMaterialDisplayName(value)}</strong>
            <span>{getMaterialType(value)}</span>
          </div>
          <a href={value} target="_blank" rel="noreferrer" aria-label={`Open ${label}`} title={`Open ${label}`}>
            <ExternalLink size={16} />
          </a>
          <button type="button" onClick={onClear} aria-label={`Remove ${label}`} title={`Remove ${label}`}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      <label className="lesson-material-url-input">
        <span><Link2 size={14} /> Material link</span>
        <input value={value} onChange={(event) => onUrlChange(event.target.value)} placeholder="Paste a public URL" />
      </label>
      <label className="lesson-file-picker">
        <UploadCloud size={18} />
        <span>{uploading ? "Uploading material..." : value ? "Replace with another file" : "Choose a file to upload"}</span>
        <input
          type="file"
          accept={accept}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileChange(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {hint ? <p className="lesson-material-hint">{hint}</p> : null}
    </div>
  );
}

export function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonError, setLessonError] = useState("");
  const [pageError, setPageError] = useState("");
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [form, setForm] = useState<LessonFormState>(emptyForm);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryLessons, setLibraryLessons] = useState<LessonLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [importingLessonId, setImportingLessonId] = useState("");
  const [uploadingMaterial, setUploadingMaterial] = useState("");
  const [creatingAssessmentLessonId, setCreatingAssessmentLessonId] = useState("");
  const [saving, setSaving] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const canManageLessons = useMemo(
    () => Boolean(user && (isAdminRole(user.role) || isInstructorRole(user.role))),
    [user],
  );

  // First lesson that hasn't been completed yet — used for Continue/Start button
  const firstIncompleteLesson = useMemo(
    () => lessons.find((lesson) => !lesson.completed) ?? null,
    [lessons],
  );

  const allComplete = lessons.length > 0 && lessons.every((lesson) => lesson.completed);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setPageError("");
    setLessonError("");

    try {
      const currentCourse = await coursesApi.get(token, id);
      setCourse(currentCourse);

      // Check whether the current user is already enrolled
      try {
        const res = await coursesApi.isEnrolled(token, id);
        setEnrolled(Boolean(res.enrolled));
      } catch {
        setEnrolled(false);
      }

      if (currentCourse.accessStatus?.allowed === false && !canManageLessons) {
        setLessons([]);
        setProgress(null);
      } else {
        // Fetch lessons-with-progress and the progress summary in parallel
        const [currentLessons, currentProgress] = await Promise.all([
          coursesApi.listLessons(token, id),
          coursesApi.getProgress(token, id),
        ]);
        setLessons(currentLessons);
        setProgress(currentProgress);
      }
    } catch {
      setPageError("Could not load this course. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [canManageLessons, id, token]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreateLesson() {
    setForm({ ...emptyForm, order: String(lessons.length + 1) });
    setShowLessonForm(true);
  }

  async function loadLessonLibrary(search = librarySearch) {
    if (!token || !id) return;
    setLibraryLoading(true);
    setLessonError("");

    try {
      const result = await coursesApi.searchLessonLibrary(token, {
        search,
        excludeCourseId: id,
      });
      setLibraryLessons(result);
    } catch {
      setLessonError("Could not load reusable lessons.");
    } finally {
      setLibraryLoading(false);
    }
  }

  function openImportModal() {
    setShowImportModal(true);
    void loadLessonLibrary("");
  }

  function startEditLesson(lesson: Lesson) {
    setForm({
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary ?? "",
      content: lesson.content ?? "",
      order: String(lesson.order),
      videoUrl: lesson.videoUrl ?? "",
      resourceUrl: lesson.resourceUrl ?? "",
      subtitleUrl: lesson.subtitleUrl ?? "",
      slideUrl: lesson.slideUrl ?? "",
      mapUrl: lesson.mapUrl ?? "",
      attachments: lesson.attachments ?? [],
    });
    setShowLessonForm(true);
  }

  async function uploadMaterial(file: File, field: "videoUrl" | "resourceUrl" | "subtitleUrl" | "slideUrl" | "mapUrl" | "attachments") {
    if (!token) return;
    setUploadingMaterial(field);
    setLessonError("");
    try {
      const uploaded = await coursesApi.uploadLessonResource(token, file, form.id);
      if (field === "attachments") {
        setForm((current) => ({
          ...current,
          attachments: [
            ...current.attachments,
            { name: file.name, url: uploaded.url, type: file.type || undefined },
          ],
        }));
      } else {
        setForm((current) => ({ ...current, [field]: uploaded.url }));
      }
    } catch {
      setLessonError("Could not upload this material. Please try again.");
    } finally {
      setUploadingMaterial("");
    }
  }

  function removeAttachment(url: string) {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((item) => item.url !== url),
    }));
  }

  async function handleSaveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !id) return;
    setSaving(true);
    setLessonError("");

    try {
      if (form.id) {
        const updated = await coursesApi.updateLesson(token, form.id, toLessonPayload(form));
        setLessons((current) =>
          current.map((lesson) => (lesson.id === updated.id ? updated : lesson)).sort((a, b) => a.order - b.order),
        );
      } else {
        const created = await coursesApi.createLesson(token, id, toLessonPayload(form));
        setLessons((current) => [...current, created].sort((a, b) => a.order - b.order));
      }
      setShowLessonForm(false);
      setForm(emptyForm);
    } catch {
      setLessonError("Could not save lesson. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!token) return;
    setLessonError("");

    try {
      await coursesApi.deleteLesson(token, lessonId);
      setLessons((current) => current.filter((lesson) => lesson.id !== lessonId));
    } catch {
      setLessonError("Could not delete lesson. Please try again.");
    }
  }

  async function handleCreateLessonAssessment(lesson: Lesson) {
    if (!token || !id) return;
    setCreatingAssessmentLessonId(lesson.id);
    setLessonError("");
    try {
      const created = await assessmentsApi.create(token, {
        courseId: id,
        lessonId: lesson.id,
        title: `${lesson.title} practice`,
        description: `Practice and knowledge check for ${lesson.title}.`,
        durationMin: 15,
        passMark: 70,
      });
      navigate(`/assessments/${created.id}/build`);
    } catch {
      setLessonError("Could not create a lesson assessment. Please try again.");
    } finally {
      setCreatingAssessmentLessonId("");
    }
  }

  async function handleImportLesson(sourceLessonId: string) {
    if (!token || !id) return;
    setImportingLessonId(sourceLessonId);
    setLessonError("");

    try {
      const imported = await coursesApi.importLesson(token, id, {
        sourceLessonId,
        order: lessons.length + 1,
      });
      setLessons((current) => [...current, imported].sort((a, b) => a.order - b.order));
      setShowImportModal(false);
    } catch {
      setLessonError("Could not import this lesson. Please try again.");
    } finally {
      setImportingLessonId("");
    }
  }

  async function handleEnroll() {
    if (!token || !id) return;
    setEnrolling(true);
    try {
      await coursesApi.enroll(token, id);
      setEnrolled(true);
      // Refresh course data (lessons/progress)
      await load();
    } catch {
      // ignore – keep UI simple
    } finally {
      setEnrolling(false);
    }
  }

  const lessonMaterialInventory = [
    { label: "Video", url: form.videoUrl, type: "Video" },
    { label: "Main resource", url: form.resourceUrl, type: getMaterialType(form.resourceUrl) },
    { label: "Subtitles", url: form.subtitleUrl, type: "Subtitle" },
    { label: "Slides", url: form.slideUrl, type: "PowerPoint" },
    { label: "Map / GIS file", url: form.mapUrl, type: "GIS / Map" },
    ...form.attachments.map((item) => ({
      label: item.name,
      url: item.url,
      type: getMaterialType(item.name || item.url, item.type),
    })),
  ].filter((item) => Boolean(item.url));

  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 size={22} className="spin" />
        Loading course...
      </div>
    );
  }

  if (pageError || !course) {
    return (
      <section className="module-page">
        <Link className="back-link" to="/courses">
          <ArrowLeft size={16} />
          Back to courses
        </Link>
        <p className="form-error">{pageError || "Course not found."}</p>
      </section>
    );
  }

  const isLocked = course.accessStatus?.allowed === false && !canManageLessons;

  return (
    <section className="module-page">
      <Link className="back-link" to="/courses">
        <ArrowLeft size={16} />
        Back to courses
      </Link>

      <div className="course-detail-hero">
        <div>
          <span className="course-code">{course.code}</span>
          <h1>{course.title}</h1>
          <p>{course.description || "No description has been added yet."}</p>
          <div className="course-detail-meta">
            {course.level ? <span>GIS {course.level}</span> : null}
            <span>{DELIVERY_MODE_LABELS[course.deliveryMode]}</span>
            <span>{course.requiresPayment ? "Paid course" : "Free course"}</span>
            <span>{course._count?.lessons ?? lessons.length} lessons</span>
          </div>

          {/* Progress summary + CTA — only for learners with access */}
          {!isLocked && !canManageLessons && progress !== null ? (
            <div className="course-progress-summary">
              {allComplete ? (
                <div className="course-complete-badge">
                  <Trophy size={18} />
                  Course complete — well done!
                </div>
              ) : (
                <>
                  <div className="course-progress-bar-row">
                    <span>{progress.progress}% complete</span>
                    <span className="course-progress-count">
                      {progress.completedLessons} / {progress.totalLessons} lessons
                    </span>
                  </div>
                  <div className="progress-track">
                    <div style={{ width: `${progress.progress}%` }} />
                  </div>
                </>
              )}
              {allComplete ? (
                <Link
                  className="secondary-button course-cta-button"
                  to={`/courses/${course.id}/lessons/${lessons[0].id}`}
                >
                  <CheckCircle2 size={17} />
                  Review from start
                </Link>
              ) : firstIncompleteLesson ? (
                <Link
                  className="primary-button course-cta-button"
                  to={`/courses/${course.id}/lessons/${firstIncompleteLesson.id}`}
                >
                  <PlayCircle size={17} />
                  {progress.completedLessons === 0 ? "Start course" : "Continue learning"}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        {canManageLessons ? (
          <div className="course-management-actions">
            <button className="primary-button" onClick={startCreateLesson}>
              <PlusCircle size={17} />
              Add lesson
            </button>
            <button className="secondary-button" onClick={openImportModal}>
              <BookOpen size={17} />
              Import existing
            </button>
          </div>
        ) : null}

        {!canManageLessons && !enrolled ? (
          <button className="primary-button" onClick={() => void handleEnroll()} disabled={enrolling}>
            <PlusCircle size={17} />
            {enrolling ? "Enrolling..." : "Enroll"}
          </button>
        ) : null}
      </div>

      {isLocked ? (
        <PaymentGate accessStatus={course.accessStatus as { allowed: false; reason: "payment_required" | "account_blocked" | "account_overdue" }} />
      ) : (
        <section className="workstream">
          <SectionHeading eyebrow="Course content" title="Lessons" compact />
          {lessonError ? <p className="form-error">{lessonError}</p> : null}

          {lessons.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={40} />
              <strong>No lessons yet</strong>
              <p>{canManageLessons ? "Add the first lesson to start building this course." : "Lessons will appear here once the trainer publishes them."}</p>
              {canManageLessons ? (
                <div className="course-management-actions">
                  <button className="primary-button" onClick={startCreateLesson}>
                    <PlusCircle size={17} />
                    Add lesson
                  </button>
                  <button className="secondary-button" onClick={openImportModal}>
                    <BookOpen size={17} />
                    Import existing
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="lesson-list">
              {lessons.map((lesson) => (
                <article className={lesson.completed ? "lesson-item is-completed" : "lesson-item"} key={lesson.id}>
                  <div className="lesson-order">{lesson.order}</div>
                  <div className="lesson-body">
                    <h3>{lesson.title}</h3>
                    {lesson.summary ? <p>{lesson.summary}</p> : null}
                    <div className="lesson-links">
                      {lesson.videoUrl ? (
                        <MaterialChip href={lesson.videoUrl} type="Video" label="Video lesson" />
                      ) : null}
                      {lesson.resourceUrl ? (
                        <MaterialChip href={lesson.resourceUrl} type={getMaterialType(lesson.resourceUrl)} label="Lesson resource" />
                      ) : null}
                      {lesson.slideUrl ? (
                        <MaterialChip href={lesson.slideUrl} type="PowerPoint" label="PowerPoint / slides" />
                      ) : null}
                      {lesson.mapUrl ? (
                        <MaterialChip href={lesson.mapUrl} type="GIS / Map" label="Map file" />
                      ) : null}
                      {lesson.subtitleUrl ? (
                        <MaterialChip href={lesson.subtitleUrl} type="Subtitle" label="Subtitles" />
                      ) : null}
                      {lesson.attachments?.map((item) => (
                        <MaterialChip
                          key={item.url}
                          href={item.url}
                          type={getMaterialType(item.name || item.url, item.type)}
                          label={item.name}
                        />
                      ))}
                      {!lesson.videoUrl && !lesson.resourceUrl && !lesson.slideUrl && !lesson.mapUrl && !lesson.subtitleUrl && !lesson.attachments?.length ? (
                        <span className="lesson-no-materials">No materials yet</span>
                      ) : null}
                    </div>
                  </div>
                  {lesson.completed ? (
                    <span className="lesson-completed-badge">
                      <CheckCircle2 size={14} />
                      Done
                    </span>
                  ) : null}
                  <Link className="secondary-button lesson-open-button" to={`/courses/${course.id}/lessons/${lesson.id}`}>
                    Open
                  </Link>
                  {canManageLessons ? (
                    <div className="lesson-actions">
                      <button
                        className="icon-button"
                        aria-label={`Add assessment to ${lesson.title}`}
                        title="Add lesson assessment"
                        disabled={creatingAssessmentLessonId === lesson.id}
                        onClick={() => void handleCreateLessonAssessment(lesson)}
                      >
                        {creatingAssessmentLessonId === lesson.id ? <Loader2 size={16} className="spin" /> : <ClipboardCheck size={16} />}
                      </button>
                      <button className="icon-button" aria-label="Edit lesson" onClick={() => startEditLesson(lesson)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-button danger" aria-label="Delete lesson" onClick={() => void handleDeleteLesson(lesson.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Assignment section — shown to all who have course access */}
      {!isLocked ? <AssignmentSection courseId={course.id} /> : null}

      {showLessonForm ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel modal-panel--lesson">
            <div className="modal-header">
              <div>
                <h2>{form.id ? "Edit lesson" : "Add lesson"}</h2>
                <p className="modal-subtitle">Build the lesson, attach its learning materials, then review everything before saving.</p>
              </div>
              <button className="payment-banner-close" onClick={() => setShowLessonForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form className="modal-form lesson-editor-form" onSubmit={handleSaveLesson}>
              <section className="lesson-form-section">
                <div className="lesson-form-section-heading">
                  <span>1</span>
                  <div>
                    <h3>Lesson details</h3>
                    <p>Give learners a clear title, overview and learning notes.</p>
                  </div>
                </div>
                <div className="lesson-form-basics-grid">
                  <label>
                    Lesson title
                    <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Understanding coordinate systems" required />
                  </label>
                  <label>
                    Position
                    <input type="number" min={1} value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} required />
                  </label>
                  <label className="lesson-form-full-field">
                    Short summary
                    <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} rows={2} placeholder="What will learners understand after this lesson?" />
                  </label>
                  <label className="lesson-form-full-field">
                    Lesson notes and instructions
                    <textarea
                      value={form.content}
                      onChange={(event) => setForm({ ...form, content: event.target.value })}
                      rows={7}
                      placeholder="Write the lesson explanation, examples, instructions, or transcript..."
                    />
                  </label>
                </div>
              </section>

              <section className="lesson-form-section">
                <div className="lesson-form-section-heading">
                  <span>2</span>
                  <div>
                    <h3>Learning materials</h3>
                    <p>Upload a file or paste a public link. Added materials appear immediately below.</p>
                  </div>
                </div>

                <div className="lesson-material-inventory" aria-live="polite">
                  <div className="lesson-material-inventory-heading">
                    <div>
                      <strong>Materials added</strong>
                      <span>{lessonMaterialInventory.length ? "Review the files currently attached to this lesson." : "No files or links have been added yet."}</span>
                    </div>
                    <b>{lessonMaterialInventory.length}</b>
                  </div>
                  {lessonMaterialInventory.length ? (
                    <div className="lesson-material-inventory-list">
                      {lessonMaterialInventory.map((item) => (
                        <a href={item.url} target="_blank" rel="noreferrer" key={`${item.label}-${item.url}`}>
                          <span><MaterialIcon type={item.type} /></span>
                          <div>
                            <strong>{item.label}</strong>
                            <small>{getMaterialDisplayName(item.url)}</small>
                          </div>
                          <ExternalLink size={15} />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="lesson-material-grid">
                <MaterialField
                  type="Video"
                  label="Video file or link"
                  value={form.videoUrl}
                  uploading={uploadingMaterial === "videoUrl"}
                  hint="Upload MP4/WebM/MOV, or paste a YouTube/Vimeo/drive link."
                  accept="video/*,.mp4,.webm,.mov,.m4v"
                  onUrlChange={(value) => setForm({ ...form, videoUrl: value })}
                  onFileChange={(file) => void uploadMaterial(file, "videoUrl")}
                  onClear={() => setForm({ ...form, videoUrl: "" })}
                />
                <MaterialField
                  type="Document"
                  label="Resource file or link"
                  value={form.resourceUrl}
                  uploading={uploadingMaterial === "resourceUrl"}
                  hint="Use this for PDFs, images, documents, datasets, or general files."
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                  onUrlChange={(value) => setForm({ ...form, resourceUrl: value })}
                  onFileChange={(file) => void uploadMaterial(file, "resourceUrl")}
                  onClear={() => setForm({ ...form, resourceUrl: "" })}
                />
                <MaterialField
                  type="Subtitle"
                  label="Subtitle file"
                  value={form.subtitleUrl}
                  uploading={uploadingMaterial === "subtitleUrl"}
                  hint="Upload .vtt or .srt captions for video lessons."
                  accept=".vtt,.srt"
                  onUrlChange={(value) => setForm({ ...form, subtitleUrl: value })}
                  onFileChange={(file) => void uploadMaterial(file, "subtitleUrl")}
                  onClear={() => setForm({ ...form, subtitleUrl: "" })}
                />
                <div className="lesson-material-field lesson-material-field--builder">
                  <div className="lesson-material-field-heading">
                    <span className="lesson-material-field-icon"><Presentation size={14} /></span>
                    <div>
                      <strong>Editable slide deck</strong>
                      <span>Build a lesson presentation without uploading a PowerPoint file.</span>
                    </div>
                  </div>
                  <PresentationDeckBuilder
                    value={form.slideUrl}
                    onChange={(value) => setForm({ ...form, slideUrl: value })}
                    onClear={() => setForm({ ...form, slideUrl: "" })}
                  />
                </div>
                <MaterialField
                  type="GIS / Map"
                  label="Map file"
                  value={form.mapUrl}
                  uploading={uploadingMaterial === "mapUrl"}
                  hint="Upload GeoJSON, KML, GeoPackage, raster, or zipped shapefile bundles."
                  accept=".zip,.shp,.shx,.dbf,.prj,.geojson,.json,.kml,.kmz,.gpkg,.tif,.tiff"
                  onUrlChange={(value) => setForm({ ...form, mapUrl: value })}
                  onFileChange={(file) => void uploadMaterial(file, "mapUrl")}
                  onClear={() => setForm({ ...form, mapUrl: "" })}
                />
              </div>
              </section>

              <section className="lesson-form-section">
                <div className="lesson-form-section-heading">
                  <span>3</span>
                  <div>
                    <h3>Extra downloads</h3>
                    <p>Add supporting worksheets, datasets, reference files or zipped shapefiles.</p>
                  </div>
                </div>
                <div className="lesson-attachment-uploader">
                <label className="lesson-file-picker lesson-file-picker--large">
                  <UploadCloud size={22} />
                  <span>{uploadingMaterial === "attachments" ? "Uploading attachment..." : "Choose one or more attachments"}</span>
                  <input
                    type="file"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      files.forEach((file) => void uploadMaterial(file, "attachments"));
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {form.attachments.length > 0 ? (
                  <div className="lesson-attachment-list">
                    {form.attachments.map((item) => (
                      <div key={item.url}>
                        <span><MaterialIcon type={getMaterialType(item.name || item.url, item.type)} /></span>
                        <a href={item.url} target="_blank" rel="noreferrer">
                          <strong>{item.name}</strong>
                          <small>{getMaterialType(item.name || item.url, item.type)}</small>
                        </a>
                        <button type="button" onClick={() => removeAttachment(item.url)} aria-label={`Remove ${item.name}`} title={`Remove ${item.name}`}><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              </section>

              {lessonError ? <p className="form-error">{lessonError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowLessonForm(false)}>
                  Cancel
                </button>
                <button className="primary-button" disabled={saving}>
                  {saving ? "Saving..." : "Save lesson"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {showImportModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>Import existing lesson/module</h2>
              <button className="payment-banner-close" onClick={() => setShowImportModal(false)} aria-label="Close">
                x
              </button>
            </div>
            <form
              className="lesson-library-search"
              onSubmit={(event) => {
                event.preventDefault();
                void loadLessonLibrary(librarySearch);
              }}
            >
              <label>
                Search library
                <input
                  value={librarySearch}
                  onChange={(event) => setLibrarySearch(event.target.value)}
                  placeholder="Search by lesson title, course code, or topic..."
                />
              </label>
              <button className="secondary-button" disabled={libraryLoading}>
                <Search size={16} />
                {libraryLoading ? "Searching..." : "Search"}
              </button>
            </form>

            {libraryLoading ? (
              <div className="inline-loader">
                <Loader2 size={18} className="spin" />
                Loading reusable modules...
              </div>
            ) : libraryLessons.length === 0 ? (
              <div className="empty-state compact">
                <strong>No reusable lessons found</strong>
                <p>Create lessons in another course first, then import them here as editable copies.</p>
              </div>
            ) : (
              <div className="lesson-library-list">
                {libraryLessons.map((lesson) => (
                  <article className="lesson-library-item" key={lesson.id}>
                    <div>
                      <span>{lesson.course.code} - {DELIVERY_MODE_LABELS[lesson.course.deliveryMode]}</span>
                      <strong>{lesson.title}</strong>
                      {lesson.summary ? <p>{lesson.summary}</p> : null}
                    </div>
                    <button
                      className="primary-button small-button"
                      disabled={importingLessonId === lesson.id}
                      onClick={() => void handleImportLesson(lesson.id)}
                      type="button"
                    >
                      {importingLessonId === lesson.id ? "Importing..." : "Import copy"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
