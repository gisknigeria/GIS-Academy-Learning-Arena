import { BookOpen, CheckCircle2, GraduationCap, Layers, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PresentationDeckBuilder } from "./PresentationDeckBuilder";
import { useAuth } from "../context/AuthContext";
import { coursesApi } from "../lib/courses-api";
import { CLASS_WRITE_ROLES } from "../types/class";
import type { Lesson } from "../types/course";
import type { ScheduleSummary } from "../lib/classes-api";

type Props = {
  classId: string;
  schedule: ScheduleSummary | null;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function ClassStudio({ classId, schedule }: Props) {
  const { token, user } = useAuth();
  const canEdit = Boolean(user && CLASS_WRITE_ROLES.includes(user.role));

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [slideDeck, setSlideDeck] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const courseId = schedule?.course.id ?? "";

  // Load lessons for this class's course
  useEffect(() => {
    if (!token || !courseId) return;
    setLoading(true);
    void coursesApi.listLessons(token, courseId)
      .then((list) => {
        setLessons(list);
        if (list[0]) {
          setSelectedLessonId(list[0].id);
          setSlideDeck(list[0].slideUrl ?? "");
        }
      })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [token, courseId]);

  function pickLesson(lessonId: string) {
    const lesson = lessons.find((l) => l.id === lessonId);
    setSelectedLessonId(lessonId);
    setSlideDeck(lesson?.slideUrl ?? "");
    setSaveStatus("idle");
  }

  async function handleSave() {
    if (!token || !selectedLessonId) return;
    setSaveStatus("saving");
    try {
      await coursesApi.updateLesson(token, selectedLessonId, {
        slideUrl: slideDeck || undefined,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    }
  }

  if (!canEdit) {
    return (
      <div className="class-studio class-studio--locked">
        <GraduationCap size={32} />
        <strong>Trainer access required</strong>
        <p>The studio is available to trainers and coordinators only.</p>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="class-studio class-studio--empty">
        <Layers size={32} />
        <strong>No course linked</strong>
        <p>This class has no course attached yet. Assign a course to start building decks.</p>
      </div>
    );
  }

  return (
    <div className="class-studio">
      {/* ── Toolbar ── */}
      <div className="class-studio__toolbar">
        <div className="class-studio__toolbar-left">
          <div className="class-studio__course-badge">
            <BookOpen size={14} />
            <span>{schedule?.course.code} — {schedule?.course.title}</span>
          </div>
          {loading ? (
            <span className="class-studio__loading"><Loader2 size={14} className="spin" /> Loading lessons…</span>
          ) : (
            <div className="class-studio__lesson-picker">
              <label htmlFor={`studio-lesson-${classId}`}>Lesson</label>
              <select
                id={`studio-lesson-${classId}`}
                value={selectedLessonId}
                onChange={(e) => pickLesson(e.target.value)}
              >
                {lessons.length === 0 && <option value="">No lessons yet</option>}
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.order}. {l.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="class-studio__toolbar-right">
          <Link className="secondary-button small-button" to={`/courses/${courseId}`}>
            <BookOpen size={14} /> Open course
          </Link>
          <button
            type="button"
            className="primary-button small-button"
            disabled={saveStatus === "saving" || !selectedLessonId}
            onClick={() => void handleSave()}
          >
            {saveStatus === "saving" ? (
              <Loader2 size={14} className="spin" />
            ) : saveStatus === "saved" ? (
              <CheckCircle2 size={14} />
            ) : (
              <Save size={14} />
            )}
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save deck"}
          </button>
        </div>
      </div>

      {saveStatus === "error" && (
        <p className="form-error" style={{ margin: "0 0 12px" }}>
          Could not save the deck. Please try again.
        </p>
      )}

      {/* ── Deck builder ── */}
      {lessons.length === 0 && !loading ? (
        <div className="class-studio__empty-lessons">
          <Layers size={28} />
          <strong>No lessons in this course yet</strong>
          <p>Add lessons to the course first, then come back here to build their slide decks.</p>
          <Link className="secondary-button" to={`/courses/${courseId}`}>
            Go to course
          </Link>
        </div>
      ) : (
        <PresentationDeckBuilder
          value={slideDeck}
          onChange={setSlideDeck}
          onClear={() => setSlideDeck("")}
        />
      )}
    </div>
  );
}
