import { BookOpen, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { curriculumApi } from "../lib/curriculum-api";
import type { Course } from "../types/course";
import type { TrainingCategory } from "../types/curriculum";

type Props = {
  availableCourses: Course[];
  onClose: () => void;
  onCreated: () => void;
};

export function CreateProgrammeModal({ availableCourses, onClose, onCreated }: Props) {
  const { token } = useAuth();
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    void curriculumApi.catalogue(token).then((data) => {
      setCategories(data);
      setCategoryId(data[0]?.id ?? "");
    }).catch(() => setError("Could not load programme categories."));
  }, [token]);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? availableCourses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(query))
      : availableCourses;
  }, [availableCourses, search]);

  function toggleCourse(courseId: string) {
    setCourseIds((current) => current.includes(courseId)
      ? current.filter((id) => id !== courseId)
      : [...current, courseId]);
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
        description: description.trim() || undefined,
        courseIds,
      });
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the programme.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create programme">
      <div className="modal-panel">
        <div className="modal-header">
          <div>
            <h2>New programme</h2>
            <p className="form-hint">A programme groups several courses into one learning offering.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          {error ? <p className="form-error">{error}</p> : null}
          <label>
            Programme name
            <input required minLength={2} placeholder="e.g. GIS Professional Diploma" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Description
            <textarea rows={3} placeholder="What will learners achieve?" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label>
            Training category
            <select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label>
            Courses ({courseIds.length} selected)
            <input placeholder="Search courses..." value={search} onChange={(event) => setSearch(event.target.value)} />
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
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={loading || !categoryId || courseIds.length === 0}>
              {loading ? <Loader2 className="spin" size={17} /> : null}
              {loading ? "Creating..." : "Create programme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
