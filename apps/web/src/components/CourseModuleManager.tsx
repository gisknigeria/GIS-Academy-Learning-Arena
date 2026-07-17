import { BookCopy, Boxes, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, FileCheck2, FileText, Loader2, Lock, PlayCircle, Plus, Search, Trash2, Video, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLessonCode, getModuleCode } from "../lib/course-code-utils";
import { curriculumApi } from "../lib/curriculum-api";
import { STATUS_LABELS } from "../types/assignment";
import type { CourseModule } from "../types/curriculum";
import type { Course, Lesson } from "../types/course";

type Props = {
  courseId: string;
  courseCode?: string;
  deliveryMode?: Course["deliveryMode"];
  canManage: boolean;
  lessons?: Lesson[];
  onChange?: (modules: CourseModule[]) => void;
};

function getLessonMaterials(lesson: Lesson) {
  return [
    lesson.videoUrl ? { label: "Video", url: lesson.videoUrl, icon: Video } : null,
    lesson.resourceUrl ? { label: "File", url: lesson.resourceUrl, icon: FileText } : null,
    lesson.slideUrl ? { label: "Slides", url: lesson.slideUrl, icon: FileText } : null,
    lesson.mapUrl ? { label: "Map", url: lesson.mapUrl, icon: FileText } : null,
    ...(lesson.attachments ?? []).map((item) => ({ label: item.name || "File", url: item.url, icon: FileText })),
  ].filter((item): item is { label: string; url: string; icon: typeof Video } => Boolean(item));
}

export function CourseModuleManager({ courseId, courseCode = "", deliveryMode = "E_LEARNING", canManage, lessons = [], onChange }: Props) {
  const { token } = useAuth();
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [library, setLibrary] = useState<CourseModule[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [expandedModuleId, setExpandedModuleId] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await curriculumApi.listModules(token, courseId);
      setModules(data);
      setExpandedModuleId((current) => current || data[0]?.id || "");
      onChange?.(data);
    } catch {
      setError("Could not load course modules.");
    }
  }, [courseId, onChange, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy("create");
    setError("");
    try {
      await curriculumApi.createModule(token, courseId, { title: title.trim(), description: description.trim() || undefined });
      setTitle("");
      setDescription("");
      setShowCreate(false);
      await load();
    } catch {
      setError("Could not create this module. Check its title and order.");
    } finally {
      setBusy("");
    }
  }

  async function openLibrary() {
    if (!token) return;
    setShowImport(true);
    setBusy("library");
    try {
      setLibrary(await curriculumApi.moduleLibrary(token, "", courseId));
    } catch {
      setError("Could not open the module library.");
    } finally {
      setBusy("");
    }
  }

  async function searchLibrary() {
    if (!token) return;
    setBusy("library");
    try {
      setLibrary(await curriculumApi.moduleLibrary(token, search, courseId));
    } finally {
      setBusy("");
    }
  }

  async function importModule(sourceModuleId: string) {
    if (!token) return;
    setBusy(sourceModuleId);
    try {
      await curriculumApi.importModule(token, courseId, sourceModuleId);
      setShowImport(false);
      await load();
    } catch {
      setError("Could not import that module.");
    } finally {
      setBusy("");
    }
  }

  async function removeModule(moduleId: string) {
    if (!token) return;
    setBusy(moduleId);
    try {
      await curriculumApi.deleteModule(token, moduleId);
      await load();
    } catch {
      setError("A module containing lessons cannot be deleted. Move or delete its lessons first.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="course-curriculum-outline">
      <div className="curriculum-outline-heading">
        <div>
          <span className="section-eyebrow">Course content</span>
          <h2>Modules</h2>
          <p>Open a module to view its lessons, materials, and required practical exercise.</p>
        </div>
        {canManage ? (
          <div className="course-module-actions">
            <button className="secondary-button small-button" onClick={() => void openLibrary()}>
              <BookCopy size={15} /> Import module
            </button>
            <button className="primary-button small-button" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> New module
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {modules.length === 0 ? (
        <div className="module-empty">
          <Boxes size={30} />
          <strong>No modules yet</strong>
          <p>{canManage ? "Create a module before adding its lessons and practical exercise." : "Your trainer is preparing this course structure."}</p>
        </div>
      ) : (
        <div className="curriculum-module-list">
          {modules.map((module) => {
            const moduleLessons = lessons.filter((lesson) => lesson.moduleId === module.id);
            const completedLessons = moduleLessons.filter((lesson) => lesson.completed).length;
            const isExpanded = expandedModuleId === module.id;

            return (
            <article key={module.id} className={isExpanded ? "curriculum-module is-open" : "curriculum-module"}>
              <button
                className="curriculum-module-toggle"
                type="button"
                onClick={() => setExpandedModuleId((current) => current === module.id ? "" : module.id)}
                aria-expanded={isExpanded}
              >
                <span className="curriculum-module-number"><small>Module</small>{getModuleCode(courseCode, module.order, deliveryMode)}</span>
                <div className="curriculum-module-copy">
                  <h3>{module.title}</h3>
                  {module.description ? <p>{module.description}</p> : null}
                  <div className="curriculum-module-meta">
                    <span>{completedLessons}/{moduleLessons.length || module.lessons?.length || 0} lessons complete</span>
                    <span><FileCheck2 size={13} /> {module.practicals?.length ?? 0} practical exercise{module.practicals?.length === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <span className="curriculum-module-chevron">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </span>
              </button>
              {canManage ? (
                <button
                  className="icon-button danger module-delete"
                  onClick={() => void removeModule(module.id)}
                  disabled={busy === module.id}
                  title="Delete empty module"
                  aria-label="Delete module"
                >
                  {busy === module.id ? <Loader2 className="spin" size={15} /> : <Trash2 size={15} />}
                </button>
              ) : null}
              {isExpanded ? (
                <div className="curriculum-module-content">
                  <div className="curriculum-lessons-heading">
                    <span>Lessons</span>
                    <b>{moduleLessons.length}</b>
                  </div>
                  {moduleLessons.length === 0 ? (
                    <div className="curriculum-empty-row">No lessons have been added to this module.</div>
                  ) : (
                    <div className="curriculum-lesson-list">
                      {moduleLessons.map((lesson) => {
                        const materials = getLessonMaterials(lesson);
                        return (
                          <article className={lesson.locked ? "curriculum-lesson is-locked" : "curriculum-lesson"} key={lesson.id}>
                            <span className="curriculum-lesson-number">{getLessonCode(courseCode, module.order, lesson.order, deliveryMode)}</span>
                            <div className="curriculum-lesson-main">
                              <div className="curriculum-lesson-title">
                                <h4>{lesson.title}</h4>
                                {lesson.completed ? <span><CheckCircle2 size={14} /> Done</span> : null}
                              </div>
                              {lesson.summary ? <p>{lesson.summary}</p> : null}
                              {materials.length ? (
                                <div className="curriculum-lesson-materials">
                                  {materials.map((material) => {
                                    const MaterialIcon = material.icon;
                                    return (
                                      <a href={material.url} target="_blank" rel="noreferrer" key={`${lesson.id}-${material.url}`}>
                                        <MaterialIcon size={14} />
                                        <strong>{material.label}</strong>
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : <span className="curriculum-no-material">Text lesson</span>}
                            </div>
                            {lesson.locked ? (
                              <span className="curriculum-lesson-action is-locked"><Lock size={15} /> Locked</span>
                            ) : (
                              <Link className="curriculum-lesson-action" to={`/courses/${courseId}/lessons/${lesson.id}`}>
                                <PlayCircle size={16} /> Open
                              </Link>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}

                  <div className="curriculum-practical-section">
                    <div className="curriculum-practical-heading">
                      <span><FileCheck2 size={16} /> Practical exercise</span>
                      <p>Complete this activity and submit your evidence before finishing the course.</p>
                    </div>
                    {module.practicals?.length ? module.practicals.map((practical) => (
                      <article className="curriculum-practical" key={practical.id}>
                        <span className="curriculum-practical-icon"><FileCheck2 size={20} /></span>
                        <div>
                          <h4>{practical.title}</h4>
                          {practical.description ? <p>{practical.description}</p> : null}
                          <span>{practical.maxScore} points</span>
                        </div>
                        <b className={practical.mySubmission?.status === "GRADED" ? "done" : ""}>
                          {practical.mySubmission ? STATUS_LABELS[practical.mySubmission.status] : "Not submitted"}
                        </b>
                        <a className="curriculum-practical-action" href={`#assignment-${practical.id}`}>
                          Open practical <ExternalLink size={14} />
                        </a>
                      </article>
                    )) : (
                      <div className="curriculum-practical-missing">
                        No practical exercise has been published for this module yet.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </article>
          )})}
        </div>
      )}

      {showCreate ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>Create module</h2>
              <button className="icon-button" onClick={() => setShowCreate(false)} aria-label="Close"><X size={17} /></button>
            </div>
            <form className="modal-form" onSubmit={(event) => void create(event)}>
              <label>Module title<input required minLength={2} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Spatial data foundations" /></label>
              <label>Description<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="primary-button" disabled={busy === "create"}>{busy === "create" ? "Creating..." : "Create module"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {showImport ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel module-library-modal">
            <div className="modal-header">
              <div><h2>Import an existing module</h2><p>The module and all its lessons will be copied into this course.</p></div>
              <button className="icon-button" onClick={() => setShowImport(false)} aria-label="Close"><X size={17} /></button>
            </div>
            <div className="module-library-search">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search module, course title or code" />
              <button className="secondary-button small-button" onClick={() => void searchLibrary()}>Search</button>
            </div>
            <div className="module-library-results">
              {busy === "library" ? <div className="inline-loader"><Loader2 className="spin" size={17} /> Loading...</div> : null}
              {!busy && library.length === 0 ? <p className="stage-empty">No reusable modules found.</p> : null}
              {library.map((module) => (
                <article key={module.id}>
                  <div><strong>{module.title}</strong><span>{module.course?.code} · {module.course?.title} · {module._count?.lessons ?? 0} lessons</span></div>
                  <button className="primary-button small-button" disabled={busy === module.id} onClick={() => void importModule(module.id)}>
                    {busy === module.id ? <Loader2 className="spin" size={14} /> : <BookCopy size={14} />} Import
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
