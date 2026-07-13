import { ArrowLeft, CheckCircle2, ExternalLink, FileArchive, FileText, Flame, Image, Loader2, Lock, Map, MessageSquare, Presentation, Send, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AchievementBadgeToast } from "../components/AchievementBadge";
import { PaymentGate } from "../components/PaymentGate";
import { useAuth } from "../context/AuthContext";
import { usePlayerXP } from "../hooks/usePlayerXP";
import { API_BASE_URL } from "../lib/api";
import { coursesApi } from "../lib/courses-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import { isSoundEnabled, sounds, toggleSound } from "../lib/sound";
import type { Course, CourseProgress, Lesson, LessonDiscussion } from "../types/course";

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

function resolveMediaUrl(href: string) {
  if (/^(https?:|blob:|data:)/i.test(href)) return href;
  if (href.startsWith("/")) {
    try {
      return `${new URL(API_BASE_URL).origin}${href}`;
    } catch {
      return href;
    }
  }
  return href;
}

function getVideoEmbedUrl(href: string) {
  try {
    const url = new URL(resolveMediaUrl(href));
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : href;
    }
    if (url.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${url.pathname.replace("/", "")}`;
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : href;
    }
  } catch {
    return href;
  }
  return href;
}

function getPrimaryMaterial(lesson: Lesson) {
  if (lesson.videoUrl) {
    return { url: lesson.videoUrl, type: "Video", title: "Video lesson" };
  }
  if (lesson.slideUrl) {
    return { url: lesson.slideUrl, type: "PowerPoint", title: "PowerPoint / slides" };
  }
  if (lesson.resourceUrl) {
    return { url: lesson.resourceUrl, type: getMaterialType(lesson.resourceUrl), title: "Lesson resource" };
  }
  if (lesson.mapUrl) {
    return { url: lesson.mapUrl, type: "GIS / Map", title: "Map file" };
  }
  const firstVisibleAttachment = lesson.attachments?.find((item) => getMaterialType(item.name || item.url, item.type) !== "Subtitle");
  if (firstVisibleAttachment) {
    return {
      url: firstVisibleAttachment.url,
      type: getMaterialType(firstVisibleAttachment.name || firstVisibleAttachment.url, firstVisibleAttachment.type),
      title: firstVisibleAttachment.name,
    };
  }
  return null;
}

function MaterialIcon({ type }: { type: string }) {
  if (type === "Video") return <Video size={18} />;
  if (type === "PowerPoint") return <Presentation size={18} />;
  if (type === "PDF" || type === "Document" || type === "Subtitle") return <FileText size={18} />;
  if (type === "Image") return <Image size={18} />;
  if (type === "GIS / Map") return <Map size={18} />;
  return <FileArchive size={18} />;
}

function MaterialLink({ href, title, type }: { href: string; title: string; type: string }) {
  const resolvedHref = resolveMediaUrl(href);

  return (
    <a href={resolvedHref} target="_blank" rel="noreferrer">
      <MaterialIcon type={type} />
      <span>
        <strong>{type}</strong>
        {title}
      </span>
      <ExternalLink size={15} />
    </a>
  );
}

function LessonMediaStage({ lesson }: { lesson: Lesson }) {
  const material = getPrimaryMaterial(lesson);

  if (!material) {
    return (
      <section className="lesson-media-stage lesson-media-stage--notes">
        <div className="lesson-media-empty">
          <FileText size={30} />
          <span>Text lesson</span>
          <strong>{lesson.content ? "Read the notes below" : "No learning material has been added yet"}</strong>
        </div>
      </section>
    );
  }

  const src = resolveMediaUrl(material.url);
  const type = material.type;
  const isDirectVideo = type === "Video" && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
  const isEmbeddedVideo = type === "Video" && /(youtube\.com|youtu\.be|vimeo\.com)/i.test(src);
  const isImage = type === "Image";
  const isPdf = type === "PDF";

  return (
    <section className="lesson-media-stage" aria-label="Lesson material preview">
      <div className="lesson-media-toolbar">
        <span>
          <MaterialIcon type={type} />
          {type}
        </span>
        <a href={src} target="_blank" rel="noreferrer">
          Open material
          <ExternalLink size={15} />
        </a>
      </div>

      <div className="lesson-media-frame">
        {isDirectVideo ? (
          <video src={src} controls autoPlay muted playsInline>
            {lesson.subtitleUrl ? <track src={resolveMediaUrl(lesson.subtitleUrl)} kind="subtitles" /> : null}
          </video>
        ) : isEmbeddedVideo ? (
          <iframe
            src={getVideoEmbedUrl(src)}
            title={material.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isImage ? (
          <img src={src} alt={material.title} />
        ) : isPdf ? (
          <iframe src={src} title={material.title} />
        ) : (
          <div className="lesson-media-preview-fallback">
            <MaterialIcon type={type} />
            <span>{type}</span>
            <strong>{material.title}</strong>
            <p>This material is ready. Open it in a new tab for the best viewing experience.</p>
            <a className="primary-button" href={src} target="_blank" rel="noreferrer">
              Open material
              <ExternalLink size={16} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export function LessonPlayerPage() {
  const { courseId, lessonId } = useParams();
  const { token, user } = useAuth();
  const { awardXP, awardBadge } = usePlayerXP();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [discussions, setDiscussions] = useState<LessonDiscussion[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [discussionError, setDiscussionError] = useState("");
  const [question, setQuestion] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [savingDiscussionId, setSavingDiscussionId] = useState<string | null>(null);
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
  const canAnswerQuestions = Boolean(user && (isAdminRole(user.role) || isInstructorRole(user.role)));

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

  useEffect(() => {
    async function loadDiscussions() {
      if (!token || !lessonId) return;
      setDiscussionError("");

      try {
        const lessonDiscussions = await coursesApi.listLessonDiscussions(token, lessonId);
        setDiscussions(lessonDiscussions);
        setAnswerDrafts(
          Object.fromEntries(
            lessonDiscussions.map((item) => [item.id, item.answer ?? ""]),
          ),
        );
      } catch {
        setDiscussionError("Could not load lesson questions.");
      }
    }

    void loadDiscussions();
  }, [lessonId, token]);

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

  async function handleAskQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !lessonId || !question.trim()) return;
    setSavingDiscussionId("new");
    setDiscussionError("");

    try {
      const created = await coursesApi.createLessonDiscussion(token, lessonId, question.trim());
      setDiscussions((current) => [created, ...current]);
      setQuestion("");
    } catch {
      setDiscussionError("Could not post your question. Please try again.");
    } finally {
      setSavingDiscussionId(null);
    }
  }

  async function handleAnswerQuestion(discussionId: string) {
    if (!token || !answerDrafts[discussionId]?.trim()) return;
    setSavingDiscussionId(discussionId);
    setDiscussionError("");

    try {
      const updated = await coursesApi.answerLessonDiscussion(token, discussionId, answerDrafts[discussionId].trim());
      setDiscussions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setDiscussionError("Could not save this answer. Please try again.");
    } finally {
      setSavingDiscussionId(null);
    }
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

          {currentLesson.locked ? (
            <article className="lesson-locked-panel">
              <Lock size={24} />
              <div>
                <h2>This onsite lesson is locked</h2>
                <p>Your trainer will unlock this lesson when your cohort reaches this part of the course.</p>
              </div>
            </article>
          ) : null}

          {!currentLesson.locked ? <LessonMediaStage lesson={currentLesson} /> : null}

          {!currentLesson.locked ? <div className="lesson-resource-panel">
            {currentLesson.videoUrl ? (
              <MaterialLink href={currentLesson.videoUrl} type="Video" title="Open video lesson" />
            ) : (
              <span>No video link has been added yet.</span>
            )}
            {currentLesson.resourceUrl ? (
              <MaterialLink href={currentLesson.resourceUrl} type={getMaterialType(currentLesson.resourceUrl)} title="Open lesson resource" />
            ) : null}
            {currentLesson.slideUrl ? (
              <MaterialLink href={currentLesson.slideUrl} type="PowerPoint" title="Open PowerPoint / slides" />
            ) : null}
            {currentLesson.mapUrl ? (
              <MaterialLink href={currentLesson.mapUrl} type="GIS / Map" title="Open map file" />
            ) : null}
            {currentLesson.subtitleUrl ? (
              <MaterialLink href={currentLesson.subtitleUrl} type="Subtitle" title="Open subtitles" />
            ) : null}
          </div> : null}

          {!currentLesson.locked && currentLesson.content ? (
            <article className="lesson-content-panel">
              <h2>Lesson notes</h2>
              <p>{currentLesson.content}</p>
            </article>
          ) : null}

          {!currentLesson.locked && currentLesson.attachments && currentLesson.attachments.length > 0 ? (
            <article className="lesson-content-panel">
              <h2>Downloads</h2>
              <div className="lesson-download-list">
                {currentLesson.attachments.map((item) => (
                  <a href={item.url} key={item.url} target="_blank" rel="noreferrer">
                    <MaterialIcon type={getMaterialType(item.name || item.url, item.type)} />
                    <span>
                      <strong>{getMaterialType(item.name || item.url, item.type)}</strong>
                      {item.name}
                    </span>
                    <ExternalLink size={15} />
                  </a>
                ))}
              </div>
            </article>
          ) : null}

          <div className="lesson-player-actions">
            <button
              className="primary-button"
              disabled={saving || currentLesson.completed || currentLesson.locked}
              onClick={() => void handleComplete()}
            >
              <CheckCircle2 size={18} />
              {currentLesson.locked ? "Locked" : currentLesson.completed ? "Completed" : saving ? "Saving..." : "Mark complete"}
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

          {!currentLesson.locked ? <article className="lesson-discussion-panel">
            <div className="lesson-discussion-header">
              <div>
                <span className="eyebrow">Lesson support</span>
                <h2>Questions and trainer answers</h2>
              </div>
              <span className="lesson-discussion-count">
                <MessageSquare size={16} />
                {discussions.length}
              </span>
            </div>

            <form className="lesson-question-form" onSubmit={handleAskQuestion}>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question about this lesson..."
                rows={3}
              />
              <button className="primary-button" disabled={savingDiscussionId === "new" || !question.trim()}>
                <Send size={16} />
                {savingDiscussionId === "new" ? "Posting..." : "Ask question"}
              </button>
            </form>

            {discussionError ? <p className="form-error">{discussionError}</p> : null}

            <div className="lesson-discussion-list">
              {discussions.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No questions yet</strong>
                  <p>Start the conversation when anything in this lesson needs more explanation.</p>
                </div>
              ) : (
                discussions.map((item) => (
                  <article className="lesson-discussion-item" key={item.id}>
                    <div className="lesson-discussion-meta">
                      <strong>{item.author.fullName}</strong>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p>{item.question}</p>
                    {item.answer ? (
                      <div className="lesson-answer-box">
                        <strong>Trainer answer</strong>
                        <p>{item.answer}</p>
                        {item.answeredBy ? <span>Answered by {item.answeredBy.fullName}</span> : null}
                      </div>
                    ) : (
                      <span className="lesson-awaiting-answer">Awaiting trainer answer</span>
                    )}

                    {canAnswerQuestions ? (
                      <div className="lesson-answer-form">
                        <textarea
                          value={answerDrafts[item.id] ?? ""}
                          onChange={(event) =>
                            setAnswerDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                          placeholder="Write trainer answer..."
                          rows={3}
                        />
                        <button
                          className="secondary-button"
                          disabled={savingDiscussionId === item.id || !answerDrafts[item.id]?.trim()}
                          onClick={() => void handleAnswerQuestion(item.id)}
                          type="button"
                        >
                          {savingDiscussionId === item.id ? "Saving..." : item.answer ? "Update answer" : "Answer"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </article> : null}
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
                {lesson.locked ? <Lock size={16} /> : null}
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
