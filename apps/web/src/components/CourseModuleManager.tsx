import { BookCopy, Boxes, CheckCircle2, ChevronDown, ChevronUp, FileCheck2, Loader2, Lock, Plus, Search, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { curriculumApi } from "../lib/curriculum-api";
import type { CourseModule } from "../types/curriculum";
import type { Lesson } from "../types/course";

type Props = {
  courseId: string;
  canManage: boolean;
  lessons?: Lesson[];
  onChange?: (modules: CourseModule[]) => void;
};

export function CourseModuleManager({ courseId, canManage, lessons = [], onChange }: Props) {
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
    <section className="course-module-manager">
      <div className="course-module-manager-head">
        <div>
          <span className="section-eyebrow">Course structure</span>
          <h2>Modules</h2>
          <p>Lessons and practical activities are organised inside these modules.</p>
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
        <div className="course-module-grid">
          {modules.map((module) => (
            <article key={module.id} className={expandedModuleId === module.id ? "course-module-card expanded" : "course-module-card"}>
              <button
                className="course-module-toggle"
                type="button"
                onClick={() => setExpandedModuleId((current) => current === module.id ? "" : module.id)}
                aria-expanded={expandedModuleId === module.id}
              >
                <span className="module-order">{module.order}</span>
                <div>
                  <h3>{module.title}</h3>
                  {module.description ? <p>{module.description}</p> : null}
                  <div className="module-stat-row">
                    <span><Boxes size={14} /> {lessons.filter((lesson) => lesson.moduleId === module.id).length || module.lessons?.length || module._count?.lessons || 0} lessons</span>
                    <span><FileCheck2 size={14} /> {module.practicals?.length ?? module._count?.practicals ?? 0} practicals</span>
                    {module.importedFromId ? <span>Imported</span> : null}
                  </div>
                </div>
                {expandedModuleId === module.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
              {expandedModuleId === module.id ? (
                <div className="module-lesson-drawer">
                  {lessons.filter((lesson) => lesson.moduleId === module.id).length === 0 ? (
                    <p>No lessons have been added to this module.</p>
                  ) : lessons.filter((lesson) => lesson.moduleId === module.id).map((lesson) =>
                    lesson.locked ? (
                      <span className="module-lesson-link locked" key={lesson.id}>
                        <span>{lesson.order}</span>
                        <strong>{lesson.title}</strong>
                        <Lock size={15} />
                      </span>
                    ) : (
                      <Link className="module-lesson-link" key={lesson.id} to={`/courses/${courseId}/lessons/${lesson.id}`}>
                        <span>{lesson.order}</span>
                        <strong>{lesson.title}</strong>
                        {lesson.completed ? <CheckCircle2 size={15} /> : null}
                      </Link>
                    ),
                  )}
                  {module.practicals?.length ? (
                    <a className="module-practical-link" href="#coursework">
                      <FileCheck2 size={15} />
                      Complete module practical
                    </a>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
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
