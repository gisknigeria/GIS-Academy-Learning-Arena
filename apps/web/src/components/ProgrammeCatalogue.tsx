import { Award, BookOpen, CheckCircle2, ChevronRight, Layers3, Loader2, LockKeyhole, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EditProgrammeModal } from "./EditProgrammeModal";
import { curriculumApi } from "../lib/curriculum-api";
import { isAdminRole } from "../lib/roles";
import type { Course } from "../types/course";
import type { LearningPathway, TrainingCategory } from "../types/curriculum";

type Props = {
  availableCourses: Course[];
  onChanged?: () => void;
};

export function ProgrammeCatalogue({ availableCourses, onChanged }: Props) {
  const { token, user } = useAuth();
  const [catalogue, setCatalogue] = useState<TrainingCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [editingProgramme, setEditingProgramme] = useState<LearningPathway | null>(null);
  const canManage = Boolean(user && (isAdminRole(user.role) || user.role === "TRAINER"));

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await curriculumApi.catalogue(token);
      setCatalogue(data);
      setActiveCategoryId((current) => current || data[0]?.id || "");
    } catch {
      setError("Could not load the programme pathways.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCategory = useMemo(
    () => catalogue.find((category) => category.id === activeCategoryId) ?? catalogue[0],
    [activeCategoryId, catalogue],
  );

  async function addCourse(stageId: string) {
    const courseId = selectedCourses[stageId];
    if (!token || !courseId) return;
    setBusyId(stageId);
    try {
      await curriculumApi.placeCourse(token, stageId, courseId);
      await load();
      onChanged?.();
    } catch {
      setError("Could not add that course to this stage.");
    } finally {
      setBusyId("");
    }
  }

  async function removeCourse(placementId: string) {
    if (!token) return;
    setBusyId(placementId);
    try {
      await curriculumApi.removeCoursePlacement(token, placementId);
      await load();
    } catch {
      setError("Could not remove this course placement.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return <div className="programme-loading"><Loader2 className="spin" size={18} /> Loading learning pathways...</div>;
  }

  return (
    <section className="programme-catalogue">
      <div className="programme-intro">
        <div>
          <span className="section-eyebrow">Structured learning pathways</span>
          <h2>Choose a programme and progress one stage at a time</h2>
          <p>Complete each required course and collect its certificate to unlock the next stage.</p>
        </div>
        <Award size={36} aria-hidden="true" />
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="programme-tabs" role="tablist" aria-label="Training categories">
        {catalogue.map((category) => (
          <button
            key={category.id}
            className={category.id === activeCategory?.id ? "active" : ""}
            onClick={() => setActiveCategoryId(category.id)}
            role="tab"
            aria-selected={category.id === activeCategory?.id}
          >
            {category.name}
          </button>
        ))}
      </div>

      {activeCategory ? (
        <div className="pathway-list">
          <header className="pathway-category-header">
            <div>
              <h3>{activeCategory.name}</h3>
              <p>{activeCategory.description}</p>
            </div>
            <span>{activeCategory.pathways.length} pathway{activeCategory.pathways.length === 1 ? "" : "s"}</span>
          </header>

          {activeCategory.pathways.map((pathway) => (
            <section className="pathway-block" key={pathway.id}>
              <div className="pathway-heading">
                <Layers3 size={20} />
                <div>
                  <h3><Link to={`/programmes/${pathway.id}`}>{pathway.name}</Link></h3>
                  {pathway.description ? <p>{pathway.description}</p> : null}
                </div>
                {canManage ? (
                  <button className="secondary-button small-button pathway-edit-button" onClick={() => setEditingProgramme(pathway)}>
                    <Pencil size={14} /> Edit programme
                  </button>
                ) : null}
              </div>

              <div className="stage-track">
                {pathway.stages.map((stage, index) => (
                  <article className={stage.unlocked ? "stage-panel" : "stage-panel locked"} key={stage.id}>
                    <div className="stage-panel-head">
                      <span className="stage-number">{stage.unlocked ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />} Stage {stage.stageNumber}</span>
                      <strong>{stage.name}</strong>
                      <p>{stage.description}</p>
                    </div>

                    <div className="stage-course-list">
                      {stage.courses.length === 0 ? (
                        <p className="stage-empty">{canManage ? "Add the first course to this stage." : "Courses will be added soon."}</p>
                      ) : stage.courses.map((placement) => (
                        <div className="stage-course" key={placement.id}>
                          <BookOpen size={16} />
                          <div>
                            <Link to={`/courses/${placement.course.id}`}>{placement.course.title}</Link>
                            <span>{placement.course.code} · {placement.course._count?.modules ?? 0} modules · {placement.course._count?.lessons ?? 0} lessons</span>
                          </div>
                          {placement.course.enrollment ? <span className="stage-progress">{placement.course.enrollment.progress}%</span> : null}
                          {canManage ? (
                            <button
                              className="icon-button danger"
                              title="Remove from stage"
                              aria-label="Remove course from stage"
                              disabled={busyId === placement.id}
                              onClick={() => void removeCourse(placement.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {canManage ? (
                      <div className="stage-add-course">
                        <select
                          value={selectedCourses[stage.id] ?? ""}
                          onChange={(event) => setSelectedCourses((current) => ({ ...current, [stage.id]: event.target.value }))}
                          aria-label={`Course for ${stage.name}`}
                        >
                          <option value="">Select existing course...</option>
                          {availableCourses
                            .filter((course) => !stage.courses.some((placement) => placement.courseId === course.id))
                            .map((course) => <option value={course.id} key={course.id}>{course.code} - {course.title}</option>)}
                        </select>
                        <button
                          className="icon-button"
                          title="Add course"
                          aria-label="Add selected course"
                          disabled={!selectedCourses[stage.id] || busyId === stage.id}
                          onClick={() => void addCourse(stage.id)}
                        >
                          {busyId === stage.id ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                    ) : null}

                    {index < pathway.stages.length - 1 ? <ChevronRight className="stage-connector" size={20} aria-hidden="true" /> : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      {editingProgramme ? (
        <EditProgrammeModal
          programme={editingProgramme}
          categories={catalogue}
          onClose={() => setEditingProgramme(null)}
          onSaved={() => {
            setEditingProgramme(null);
            void load();
            onChanged?.();
          }}
        />
      ) : null}
    </section>
  );
}
