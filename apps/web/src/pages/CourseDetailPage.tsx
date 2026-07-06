import { ArrowLeft, BookOpen, CheckCircle2, Edit3, ExternalLink, Loader2, PlayCircle, PlusCircle, Trophy, Trash2, Video } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AssignmentSection } from "../components/AssignmentSection";
import { PaymentGate } from "../components/PaymentGate";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { coursesApi } from "../lib/courses-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type { Course, CourseProgress, CreateLessonPayload, Lesson } from "../types/course";
import { DELIVERY_MODE_LABELS } from "../types/course";

type LessonFormState = {
  id?: string;
  title: string;
  summary: string;
  order: string;
  videoUrl: string;
  resourceUrl: string;
};

const emptyForm: LessonFormState = {
  title: "",
  summary: "",
  order: "1",
  videoUrl: "",
  resourceUrl: "",
};

function toLessonPayload(form: LessonFormState): CreateLessonPayload {
  return {
    title: form.title,
    summary: form.summary || undefined,
    order: Number(form.order),
    videoUrl: form.videoUrl || undefined,
    resourceUrl: form.resourceUrl || undefined,
  };
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
  const [form, setForm] = useState<LessonFormState>(emptyForm);
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

  function startEditLesson(lesson: Lesson) {
    setForm({
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary ?? "",
      order: String(lesson.order),
      videoUrl: lesson.videoUrl ?? "",
      resourceUrl: lesson.resourceUrl ?? "",
    });
    setShowLessonForm(true);
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
          <button className="primary-button" onClick={startCreateLesson}>
            <PlusCircle size={17} />
            Add lesson
          </button>
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
                <button className="primary-button" onClick={startCreateLesson}>
                  <PlusCircle size={17} />
                  Add lesson
                </button>
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
                Order
                <input type="number" min={1} value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} required />
              </label>
              <label>
                Video URL
                <input value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} placeholder="https://..." />
              </label>
              <label>
                Resource URL
                <input value={form.resourceUrl} onChange={(event) => setForm({ ...form, resourceUrl: event.target.value })} placeholder="https://..." />
              </label>
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
    </section>
  );
}
