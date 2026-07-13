import { ArrowLeft, BookOpen, CheckCircle2, Edit3, ExternalLink, Loader2, PlayCircle, PlusCircle, Search, Trophy, Trash2, Video } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AssignmentSection } from "../components/AssignmentSection";
import { PaymentGate } from "../components/PaymentGate";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { coursesApi } from "../lib/courses-api";
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
    title: form.title,
    summary: form.summary || undefined,
    content: form.content || undefined,
    order: Number(form.order),
    videoUrl: form.videoUrl || undefined,
    resourceUrl: form.resourceUrl || undefined,
    subtitleUrl: form.subtitleUrl || undefined,
    slideUrl: form.slideUrl || undefined,
    mapUrl: form.mapUrl || undefined,
    attachments: form.attachments,
  };
}

function MaterialField({
  label,
  value,
  uploading,
  hint,
  accept,
  onUrlChange,
  onFileChange,
}: {
  label: string;
  value: string;
  uploading: boolean;
  hint?: string;
  accept?: string;
  onUrlChange: (value: string) => void;
  onFileChange: (file: File) => void;
}) {
  return (
    <div className="lesson-material-field">
      <label>
        {label}
        <input value={value} onChange={(event) => onUrlChange(event.target.value)} placeholder="Paste URL or upload file" />
      </label>
      {hint ? <p className="lesson-material-hint">{hint}</p> : null}
      <label className="lesson-file-picker">
        Upload file
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
      {uploading ? <span className="uploading-note">Uploading...</span> : null}
    </div>
  );
}

export function CourseDetailPage() {
  const { id } = useParams();
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
                        <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                          <Video size={14} />
                          Video
                        </a>
                      ) : null}
                      {lesson.resourceUrl ? (
                        <a href={lesson.resourceUrl} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} />
                          Resource
                        </a>
                      ) : null}
                      {lesson.slideUrl ? (
                        <a href={lesson.slideUrl} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} />
                          Slides
                        </a>
                      ) : null}
                      {lesson.mapUrl ? (
                        <a href={lesson.mapUrl} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} />
                          Map
                        </a>
                      ) : null}
                      {lesson.subtitleUrl ? (
                        <a href={lesson.subtitleUrl} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} />
                          Subtitles
                        </a>
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
          <section className="modal-panel">
            <div className="modal-header">
              <h2>{form.id ? "Edit lesson" : "Add lesson"}</h2>
              <button className="payment-banner-close" onClick={() => setShowLessonForm(false)} aria-label="Close">
                x
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSaveLesson}>
              <label>
                Title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              </label>
              <label>
                Summary
                <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
              </label>
              <label>
                Lesson content
                <textarea
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  rows={6}
                  placeholder="Write the lesson notes, instructions, examples, or transcript here..."
                />
              </label>
              <label>
                Order
                <input type="number" min={1} value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} required />
              </label>
              <div className="lesson-material-grid">
                <MaterialField
                  label="Video file or link"
                  value={form.videoUrl}
                  uploading={uploadingMaterial === "videoUrl"}
                  hint="Upload MP4/WebM/MOV, or paste a YouTube/Vimeo/drive link."
                  accept="video/*,.mp4,.webm,.mov,.m4v"
                  onUrlChange={(value) => setForm({ ...form, videoUrl: value })}
                  onFileChange={(file) => void uploadMaterial(file, "videoUrl")}
                />
                <MaterialField
                  label="Resource file or link"
                  value={form.resourceUrl}
                  uploading={uploadingMaterial === "resourceUrl"}
                  hint="Use this for PDFs, images, documents, datasets, or general files."
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                  onUrlChange={(value) => setForm({ ...form, resourceUrl: value })}
                  onFileChange={(file) => void uploadMaterial(file, "resourceUrl")}
                />
                <MaterialField
                  label="Subtitle file"
                  value={form.subtitleUrl}
                  uploading={uploadingMaterial === "subtitleUrl"}
                  hint="Upload .vtt or .srt captions for video lessons."
                  accept=".vtt,.srt"
                  onUrlChange={(value) => setForm({ ...form, subtitleUrl: value })}
                  onFileChange={(file) => void uploadMaterial(file, "subtitleUrl")}
                />
                <MaterialField
                  label="PowerPoint / slides"
                  value={form.slideUrl}
                  uploading={uploadingMaterial === "slideUrl"}
                  hint="Upload PowerPoint, PDF, or slide deck material."
                  accept=".ppt,.pptx,.pdf"
                  onUrlChange={(value) => setForm({ ...form, slideUrl: value })}
                  onFileChange={(file) => void uploadMaterial(file, "slideUrl")}
                />
                <MaterialField
                  label="Map file"
                  value={form.mapUrl}
                  uploading={uploadingMaterial === "mapUrl"}
                  hint="Upload GeoJSON, KML, GeoPackage, raster, or zipped shapefile bundles."
                  accept=".zip,.shp,.shx,.dbf,.prj,.geojson,.json,.kml,.kmz,.gpkg,.tif,.tiff"
                  onUrlChange={(value) => setForm({ ...form, mapUrl: value })}
                  onFileChange={(file) => void uploadMaterial(file, "mapUrl")}
                />
              </div>
              <div className="lesson-attachment-uploader">
                <label>
                  Extra attachments
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
                {uploadingMaterial === "attachments" ? <span className="uploading-note">Uploading attachment...</span> : null}
                {form.attachments.length > 0 ? (
                  <div className="lesson-attachment-list">
                    {form.attachments.map((item) => (
                      <span key={item.url}>
                        <a href={item.url} target="_blank" rel="noreferrer">{item.name}</a>
                        <button type="button" onClick={() => removeAttachment(item.url)}>Remove</button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
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
