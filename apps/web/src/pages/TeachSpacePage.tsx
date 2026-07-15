import { BookOpen, GraduationCap, Loader2, PlusCircle, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { coursesApi } from "../lib/courses-api";
import { isInstructorRole } from "../lib/roles";
import type { Course, Lesson } from "../types/course";
import { PresentationDeckBuilder } from "../components/PresentationDeckBuilder";

export function TeachSpacePage() {
  const { token, user } = useAuth();
  const canManageLessons = useMemo(() => Boolean(user && isInstructorRole(user.role)), [user]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [slideDeck, setSlideDeck] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      setLoading(true);
      try {
        const result = await coursesApi.list(token, { limit: 100, includeArchived: false });
        const courseList = result.data ?? [];
        setCourses(courseList);
        if (courseList[0]) {
          setSelectedCourseId(courseList[0].id);
        }
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedCourseId) return;
    void (async () => {
      try {
        const courseLessons = await coursesApi.listLessons(token, selectedCourseId);
        setLessons(courseLessons);
        if (!selectedLessonId && courseLessons[0]) {
          setSelectedLessonId(courseLessons[0].id);
          setSlideDeck(courseLessons[0].slideUrl ?? "");
        }
      } catch {
        setLessons([]);
      }
    })();
  }, [selectedCourseId, selectedLessonId, token]);

  async function handleLessonPick(lessonId: string) {
    if (!token) return;
    const lesson = lessons.find((entry) => entry.id === lessonId);
    setSelectedLessonId(lessonId);
    setSlideDeck(lesson?.slideUrl ?? "");
  }

  async function handleSaveDeck() {
    if (!token || !selectedLessonId) return;
    try {
      await coursesApi.updateLesson(token, selectedLessonId, { slideUrl: slideDeck || undefined });
    } catch {
      // Keep the UI simple and preserve local draft state.
    }
  }

  if (!canManageLessons) {
    return (
      <section className="module-page">
        <SectionHeading eyebrow="TeachSpace" title="Trainer workspace" compact />
        <div className="empty-state">
          <GraduationCap size={40} />
          <strong>Trainer access required</strong>
          <p>This workspace is only available to instructors and trainers.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="module-page">
      <SectionHeading eyebrow="TeachSpace" title="Trainer workspace" action="Lesson builder" />
      <div className="teachspace-hero">
        <div>
          <strong>Create and refine lesson decks</strong>
          <p>Draft a new slide presentation for each lesson without uploading a PowerPoint file.</p>
        </div>
        <div className="teachspace-hero__pill">
          <Sparkles size={16} />
          Editable decks • reusable templates
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <Loader2 size={20} className="spin" />
          Loading trainer workspace...
        </div>
      ) : (
        <div className="teachspace-grid">
          <div className="teachspace-card">
            <div className="teachspace-card__header">
              <span><BookOpen size={16} />Select course</span>
            </div>
            <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          <div className="teachspace-card">
            <div className="teachspace-card__header">
              <span><Users size={16} />Select lesson</span>
            </div>
            <select value={selectedLessonId} onChange={(event) => handleLessonPick(event.target.value)}>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
              ))}
            </select>
            <div className="teachspace-card__actions">
              <Link className="secondary-button" to={`/courses/${selectedCourseId}`}>
                Open course
              </Link>
              <button className="primary-button" type="button" onClick={() => void handleSaveDeck()}>
                <PlusCircle size={16} />
                Save deck
              </button>
            </div>
          </div>

          <div className="teachspace-card teachspace-card--full">
            <div className="teachspace-card__header">
              <span><GraduationCap size={16} />Slide deck editor</span>
            </div>
            <PresentationDeckBuilder value={slideDeck} onChange={setSlideDeck} onClear={() => setSlideDeck("")} />
          </div>
        </div>
      )}
    </section>
  );
}
