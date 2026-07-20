import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCourseAccessLevelOptions, trainingCategories } from "../data/knowledgeHub";
import { coursesApi } from "../lib/courses-api";
import type { Course, DeliveryMode, UpdateCoursePayload } from "../types/course";

type Props = { course: Course; onClose: () => void; onSaved: (course: Course) => void };

const MODES: { value: DeliveryMode; label: string }[] = [
  { value: "E_LEARNING", label: "E-Learning" },
  { value: "ONSITE", label: "Onsite" },
  { value: "LIVE_VIRTUAL", label: "Live virtual" },
  { value: "HYBRID", label: "Hybrid" },
];

export function EditCourseModal({ course, onClose, onSaved }: Props) {
  const { token } = useAuth();
  const [form, setForm] = useState<UpdateCoursePayload>({
    code: course.code,
    title: course.title,
    description: course.description ?? "",
    trainingCategory: course.trainingCategory ?? "Academy",
    level: course.level ?? 100,
    deliveryMode: course.deliveryMode,
    requiresPayment: course.requiresPayment,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const levels = useMemo(() => getCourseAccessLevelOptions(form.trainingCategory), [form.trainingCategory]);

  function set<K extends keyof UpdateCoursePayload>(key: K, value: UpdateCoursePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const updated = await coursesApi.update(token, course.id, {
        ...form,
        code: form.code?.trim().toUpperCase(),
        title: form.title?.trim(),
        description: form.description?.trim(),
      });
      onSaved(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the course.");
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit course">
      <div className="modal-panel">
        <div className="modal-header"><h2>Edit course</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <form className="modal-form" onSubmit={submit}>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="form-row">
            <label>Course code<input required value={form.code ?? ""} onChange={(event) => set("code", event.target.value)} /></label>
            <label>Access level<select value={form.level ?? 100} onChange={(event) => set("level", Number(event.target.value))}>{levels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
          </div>
          <label>Title<input required minLength={3} value={form.title ?? ""} onChange={(event) => set("title", event.target.value)} /></label>
          <label>Description<textarea rows={3} value={form.description ?? ""} onChange={(event) => set("description", event.target.value)} /></label>
          <div className="form-row">
            <label>Training category<select value={form.trainingCategory ?? "Academy"} onChange={(event) => set("trainingCategory", event.target.value)}>{trainingCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Delivery mode<select value={form.deliveryMode} onChange={(event) => set("deliveryMode", event.target.value as DeliveryMode)}>{MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
          </div>
          <label className="filter-toggle"><input type="checkbox" checked={form.requiresPayment ?? true} onChange={(event) => set("requiresPayment", event.target.checked)} /> Requires payment</label>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : null}{saving ? "Saving..." : "Save changes"}</button></div>
        </form>
      </div>
    </div>
  );
}
