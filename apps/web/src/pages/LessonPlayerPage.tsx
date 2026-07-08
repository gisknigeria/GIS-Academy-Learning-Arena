import { ArrowLeft, CheckCircle2, ExternalLink, Flame, Loader2, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AchievementBadgeToast } from "../components/AchievementBadge";
import { PaymentGate } from "../components/PaymentGate";
import { useAuth } from "../context/AuthContext";
import { usePlayerXP } from "../hooks/usePlayerXP";
import { coursesApi } from "../lib/courses-api";
import { isSoundEnabled, sounds, toggleSound } from "../lib/sound";
import type { Course, CourseProgress, Lesson } from "../types/course";

export function LessonPlayerPage() {
  const { courseId, lessonId } = useParams();
  const { token } = useAuth();
  const { awardXP, awardBadge } = usePlayerXP();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [streak, setStreak] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("gis_quest_streak") ?? 0);
  });

  const currentIndex = useMemo(
    () => lessons.findIndex((lesson) => lesson.id === lessonId),
    [lessonId, lessons],
  );
  const currentLesson = currentIndex >= 0 ? lessons[currentIndex] : null;
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const load = useCallback(async () => {
    if (!token || !courseId) return;
    setLoading(true);
    setError("");

    try {
      const [courseData, lessonData, progressData] = await Promise.all([
        coursesApi.get(token, courseId),
        coursesApi.listLessons(token, courseId),
        coursesApi.getProgress(token, courseId),
      ]);
      setCourse(courseData);
      setLessons(lessonData);
      setProgress(progressData);
    } catch {
      setError("Could not load this lesson. It may be locked or unavailable.");
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleComplete() {
    if (!token || !courseId || !lessonId) return;
    setSaving(true);
    setError("");

    try {
      const updatedProgress = await coursesApi.markLessonComplete(token, courseId, lessonId);
      setProgress(updatedProgress);
      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === lessonId
            ? { ...lesson, completed: true, completedAt: new Date().toISOString() }
            : lesson,
        ),
      );

      if (soundOn) {
        sounds.lessonComplete();
      }

      void awardXP("lesson_complete", { courseId, lessonId });
      void awardBadge("first_lesson");

      const nextStreak = Number(localStorage.getItem("gis_quest_streak") ?? 0) + 1;
      localStorage.setItem("gis_quest_streak", String(nextStreak));
      setStreak(nextStreak);
      void awardXP("streak_milestone", { streak: nextStreak });

      if ([3, 7, 14, 30].includes(nextStreak)) {
        setBadgeToast(`streak_${nextStreak}`);
        void awardBadge(`streak_${nextStreak}`);
      }

      if (updatedProgress.progress === 100) {
        setBadgeToast("course_graduate");
        void awardBadge("course_graduate");
      }
    } catch {
      setError("Could not mark this lesson as complete. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSoundToggle() {
    const on = toggleSound();
    setSoundOn(on);
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 size={22} className="spin" />
        Loading lesson...
      </div>
    );
  }

  if (course?.accessStatus?.allowed === false) {
    return (
      <section className="module-page">
        <Link className="back-link" to={`/courses/${courseId}`}>
          <ArrowLeft size={16} />
          Back to course
        </Link>
        <PaymentGate accessStatus={course.accessStatus as { allowed: false; reason: "payment_required" | "account_blocked" | "account_overdue" }} />
      </section>
    );
  }

  if (error || !currentLesson || !course) {
    return (
      <section className="module-page">
        <Link className="back-link" to={`/courses/${courseId}`}>
          <ArrowLeft size={16} />
          Back to course
        </Link>
        <p className="form-error">{error || "Lesson not found."}</p>
      </section>
    );
  }

  return (
    <section className="lesson-player-page">
      <Link className="back-link" to={`/courses/${courseId}`}>
        <ArrowLeft size={16} />
        Back to course
      </Link>

      <div className="lesson-player-grid">
        <article className="lesson-player-main">
          <span className="course-code">{course.code}</span>
          <h1>{currentLesson.title}</h1>
          {currentLesson.summary ? <p>{currentLesson.summary}</p> : null}

          <div className="lesson-resource-panel">
            {currentLesson.videoUrl ? (
              <a href={currentLesson.videoUrl} target="_blank" rel="noreferrer">
                <Video size={18} />
                Open video lesson
              </a>
            ) : (
              <span>No video link has been added yet.</span>
            )}
            {currentLesson.resourceUrl ? (
              <a href={currentLesson.resourceUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={18} />
                Open lesson resource
              </a>
            ) : null}
          </div>

          <div className="lesson-player-actions">
            <button
              className="primary-button"
              disabled={saving || currentLesson.completed}
              onClick={() => void handleComplete()}
            >
              <CheckCircle2 size={18} />
              {currentLesson.completed ? "Completed" : saving ? "Saving..." : "Mark complete"}
            </button>
            <button className="secondary-button" onClick={handleSoundToggle} type="button">
              {soundOn ? "Sound on" : "Sound off"}
            </button>
            <div className="lesson-nav-actions">
              {previousLesson ? (
                <Link className="secondary-button" to={`/courses/${courseId}/lessons/${previousLesson.id}`}>
                  Previous
                </Link>
              ) : null}
              {nextLesson ? (
                <Link className="secondary-button" to={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </article>

        <aside className="lesson-playlist">
          <div className="lesson-progress-card">
            <strong>{progress?.progress ?? 0}% complete</strong>
            <span>
              {progress?.completedLessons ?? 0} of {progress?.totalLessons ?? lessons.length} lessons completed
            </span>
            <div className="lesson-streak-pill">
              <Flame size={16} />
              {streak} day streak
            </div>
            <div className="progress-track">
              <div style={{ width: `${progress?.progress ?? 0}%` }} />
            </div>
          </div>

          <div className="lesson-playlist-list">
            {lessons.map((lesson) => (
              <Link
                className={lesson.id === currentLesson.id ? "playlist-item active" : "playlist-item"}
                key={lesson.id}
                to={`/courses/${courseId}/lessons/${lesson.id}`}
              >
                <span>{lesson.order}</span>
                <strong>{lesson.title}</strong>
                {lesson.completed ? <CheckCircle2 size={16} /> : null}
              </Link>
            ))}
          </div>
        </aside>
      </div>

      {badgeToast && (
        <AchievementBadgeToast badgeKey={badgeToast} onClose={() => setBadgeToast(null)} />
      )}
    </section>
  );
}

// Badge toast is rendered outside the main section for correct stacking context

