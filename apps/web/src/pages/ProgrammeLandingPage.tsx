import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Layers3,
  Loader2,
  LockKeyhole,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { curriculumApi } from "../lib/curriculum-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type { LearningPathway, TrainingCategory } from "../types/curriculum";

function parseLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function ProgrammeLandingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [programme, setProgramme] = useState<LearningPathway | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const canManage = Boolean(user && (isAdminRole(user.role) || isInstructorRole(user.role)));

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch full catalogue and find this programme by id
      const catalogue: TrainingCategory[] = await curriculumApi.catalogue(token);
      let found: LearningPathway | null = null;
      for (const cat of catalogue) {
        const match = cat.pathways.find((p) => p.id === id);
        if (match) { found = match; break; }
      }
      if (!found) throw new Error("Programme not found.");
      setProgramme(found);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load this programme.");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => { void load(); }, [load]);

  async function handleEnrol() {
    if (!token || !id) return;
    setEnrolling(true);
    setError("");
    try {
      const result = await curriculumApi.enrollProgramme(token, id);
      navigate(`/courses/${result.firstCourseId}/workspace`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not enrol in this programme.");
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="course-landing-loading">
        <Loader2 className="spin" size={28} />
        <span>Loading programme…</span>
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="course-landing-error">
        <p>{error || "Programme not found."}</p>
        <button className="secondary-button" onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  const outcomes  = parseLines(programme.whatYoullLearn);
  const prereqs   = parseLines(programme.prerequisites);
  const audience  = parseLines(programme.targetAudience);
  const totalCourses = programme.stages.reduce((sum, s) => sum + s.courses.length, 0);
  const enrolled = programme.stages.some((stage) => stage.courses.some((placement) => Boolean(placement.course.enrollment)));
  const firstCourseId = programme.stages[0]?.courses[0]?.course?.id;

  return (
    <div className="course-landing">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div
        className="course-landing__hero course-landing__hero--programme"
        style={programme.thumbnailUrl ? { backgroundImage: `url(${programme.thumbnailUrl})` } : undefined}
      >
        <div className="course-landing__hero-overlay" />
        <div className="course-landing__hero-body">
          <div className="course-landing__meta-row">
            <span className="landing-tag"><Layers3 size={13} /> Programme</span>
            <span className="landing-tag">{programme.stages.length} stage{programme.stages.length !== 1 ? "s" : ""}</span>
            <span className="landing-tag">{totalCourses} course{totalCourses !== 1 ? "s" : ""}</span>
          </div>
          <h1 className="course-landing__title">{programme.name}</h1>
          {programme.description ? <p className="course-landing__description">{programme.description}</p> : null}
        </div>

        {/* CTA card */}
        <div className="course-landing__enrol-card">
          {programme.thumbnailUrl ? (
            <img src={programme.thumbnailUrl} alt={programme.name} className="course-landing__thumbnail" />
          ) : null}
          <p className="course-landing__enrol-label">{canManage ? "Programme management" : enrolled ? "You are enrolled" : "Start with Stage 1"}</p>
          {firstCourseId && canManage ? (
            <Link className="primary-button course-landing__enrol-btn" to={`/courses/${firstCourseId}/workspace`}>
              Manage programme courses
            </Link>
          ) : firstCourseId && enrolled ? (
            <Link className="primary-button course-landing__enrol-btn" to={`/courses/${firstCourseId}/workspace`}>
              Continue programme
            </Link>
          ) : firstCourseId ? (
            <button className="primary-button course-landing__enrol-btn" onClick={() => void handleEnrol()} disabled={enrolling}>
              {enrolling ? <Loader2 className="spin" size={16} /> : null}
              {enrolling ? "Enrolling…" : "Enrol in programme"}
            </button>
          ) : (
            <p className="form-hint">No courses have been added yet.</p>
          )}
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="course-landing__body">

        {outcomes.length > 0 && (
          <section className="course-landing__section">
            <h2>What you'll learn</h2>
            <ul className="course-landing__outcomes">
              {outcomes.map((item, i) => (
                <li key={i}><CheckCircle2 size={16} className="outcome-check" /><span>{item}</span></li>
              ))}
            </ul>
          </section>
        )}

        {prereqs.length > 0 && (
          <section className="course-landing__section">
            <h2>Prerequisites</h2>
            <ul className="course-landing__list">
              {prereqs.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>
        )}

        {audience.length > 0 && (
          <section className="course-landing__section">
            <h2><Users size={18} /> Who this is for</h2>
            <ul className="course-landing__list">
              {audience.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>
        )}

        {/* Stage breakdown */}
        <section className="course-landing__section">
          <h2><Layers3 size={18} /> Programme stages</h2>
          <div className="programme-landing__stages">
            {programme.stages.map((stage, idx) => (
              <div className={`programme-landing__stage ${stage.unlocked ? "" : "programme-landing__stage--locked"}`} key={stage.id}>
                <div className="programme-landing__stage-head">
                  {stage.unlocked
                    ? <CheckCircle2 size={18} className="stage-icon--open" />
                    : <LockKeyhole size={18} className="stage-icon--locked" />}
                  <div>
                    <strong>Stage {stage.stageNumber}: {stage.name}</strong>
                    {stage.description ? <p>{stage.description}</p> : null}
                  </div>
                </div>
                <ul className="programme-landing__course-list">
                  {stage.courses.map((placement) => (
                    <li key={placement.id}>
                      <BookOpen size={14} />
                      {stage.unlocked ? (
                        <Link to={`/courses/${placement.course.id}`}>{placement.course.title}</Link>
                      ) : (
                        <span>{placement.course.title}</span>
                      )}
                      <small>{placement.course.code}</small>
                    </li>
                  ))}
                </ul>
                {idx < programme.stages.length - 1 ? <ChevronRight className="stage-connector" size={20} aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
