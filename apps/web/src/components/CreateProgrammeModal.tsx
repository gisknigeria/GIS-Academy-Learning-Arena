import { BookOpen, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { curriculumApi } from "../lib/curriculum-api";
import type { Course } from "../types/course";
import type { TrainingCategory } from "../types/curriculum";

type Props = { availableCourses: Course[]; onClose: () => void; onCreated: () => void };
type Tab = "basic" | "overview";

export function CreateProgrammeModal({ availableCourses, onClose, onCreated }: Props) {
  const { token } = useAuth();
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [tab, setTab]               = useState<Tab>("basic");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName]             = useState("");
  const [description, setDescription]       = useState("");
  const [thumbnailUrl, setThumbnailUrl]     = useState("");
  const [whatYoullLearn, setWhatYoullLearn] = useState("");
  const [prerequisites, setPrerequisites]   = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [courseIds, setCourseIds]   = useState<string[]>([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    if (!token) return;
    void curriculumApi.catalogue(token).then((data) => {
      setCategories(data);
      setCategoryId(data[0]?.id ?? "");
    }).catch(() => setError("Could not load programme categories."));
  }, [token]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? availableCourses.filter((c) => `${c.code} ${c.title}`.toLowerCase().includes(q)) : availableCourses;
  }, [availableCourses, search]);

  function toggleCourse(id: string) {
    setCourseIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !categoryId || courseIds.length === 0) return;
    setLoading(true);
    setError("");
    try {
      await curriculumApi.createProgramme(token, {
        categoryId,
        name: name.trim(),
        description:    description.trim()    || undefined,
        thumbnailUrl:   thumbnailUrl.trim()   || undefined,
        whatYoullLearn: whatYoullLearn.trim() || undefined,
        prerequisites:  prerequisites.trim()  || undefined,
        targetAudience: targetAudience.trim() || undefined,
        courseIds,
      });
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the programme.");
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create programme">
      <div className="modal-panel modal-panel--wide">
        <div className="modal-header">
          <div>
            <h2>New programme</h2>
            <p className="form-hint">A programme groups several courses into one learning offering.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="overview-modal-tabs">
          <button type="button" className={tab === "basic"    ? "active" : ""} onClick={() => setTab("basic")}>Basic info</button>
          <button type="button" className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Overview page</button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          {error ? <p className="form-error">{error}</p> : null}

          {tab === "basic" && (
            <>
              <label>Programme name<input required minLength={2} placeholder="e.g. GIS Professional Diploma" value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label>Short description<textarea rows={3} placeholder="What will learners achieve?" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
              <label>
                Training category
                <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label>
                Courses ({courseIds.length} selected)
                <input placeholder="Search courses…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </label>
              <div className="programme-course-picker">
                {filteredCourses.map((course) => (
                  <label className="programme-course-option" key={course.id}>
                    <input type="checkbox" checked={courseIds.includes(course.id)} onChange={() => toggleCourse(course.id)} />
                    <BookOpen size={16} />
                    <span><strong>{course.title}</strong><small>{course.code}</small></span>
                  </label>
                ))}
                {filteredCourses.length === 0 ? <p className="form-hint">No matching courses.</p> : null}
              </div>
            </>
          )}

          {tab === "overview" && (
            <>
              <p className="form-hint">This information appears on the programme landing page learners see before enrolling. You can fill it in now or later.</p>
              <label>Thumbnail image URL<input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://…" /></label>
              <label>
                What you'll learn
                <textarea rows={5} value={whatYoullLearn} onChange={(e) => setWhatYoullLearn(e.target.value)} placeholder={"One outcome per line, e.g.:\nMaster GIS fundamentals\nBuild real-world spatial applications"} />
              </label>
              <label>Prerequisites<textarea rows={3} value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} placeholder="What should learners already know?" /></label>
              <label>Who this is for<textarea rows={3} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Describe the ideal learner." /></label>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={loading || !categoryId || courseIds.length === 0}>
              {loading ? "Creating…" : "Create programme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
