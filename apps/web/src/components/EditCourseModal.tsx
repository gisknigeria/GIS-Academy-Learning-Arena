import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCourseAccessLevelOptions, trainingCategories } from "../data/knowledgeHub";
import { coursesApi } from "../lib/courses-api";
import type { Course, DeliveryMode, UpdateCoursePayload } from "../types/course";

type Props = { course: Course; onClose: () => void; onSaved: (course: Course) => void };

const MODES: { value: DeliveryMode; label: string }[] = [
  { value: "E_LEARNING",    label: "E-Learning" },
  { value: "ONSITE",        label: "Onsite" },
  { value: "LIVE_VIRTUAL",  label: "Live virtual" },
  { value: "HYBRID",        label: "Hybrid" },
];

type Tab = "basic" | "overview";

export function EditCourseModal({ course, onClose, onSaved }: Props) {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("basic");
  const [form, setForm] = useState<UpdateCoursePayload>({
    code:              course.code,
    title:             course.title,
    description:       course.description       ?? "",
    thumbnailUrl:      course.thumbnailUrl       ?? "",
    bannerUrl:         course.bannerUrl          ?? "",
    whatYoullLearn:    course.whatYoullLearn     ?? "",
    prerequisites:     course.prerequisites      ?? "",
    targetAudience:    course.targetAudience     ?? "",
    language:          course.language           ?? "",
    estimatedHours:    course.estimatedHours     ?? undefined,
    trainingCategory:  course.trainingCategory   ?? "Academy",
    level:             course.level              ?? 100,
    deliveryMode:      course.deliveryMode,
    requiresPayment:   course.requiresPayment,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const levels = useMemo(() => getCourseAccessLevelOptions(form.trainingCategory), [form.trainingCategory]);

  function set<K extends keyof UpdateCoursePayload>(key: K, value: UpdateCoursePayload[K]) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const updated = await coursesApi.update(token, course.id, {
        ...form,
        code:           form.code?.trim().toUpperCase(),
        title:          form.title?.trim(),
        description:    form.description?.trim()    || undefined,
        thumbnailUrl:   form.thumbnailUrl?.trim()   || undefined,
        bannerUrl:      form.bannerUrl?.trim()      || undefined,
        whatYoullLearn: form.whatYoullLearn?.trim() || undefined,
        prerequisites:  form.prerequisites?.trim()  || undefined,
        targetAudience: form.targetAudience?.trim() || undefined,
        language:       form.language?.trim()       || undefined,
      });
      onSaved(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the course.");
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit course">
      <div className="modal-panel modal-panel--wide">
        <div className="modal-header">
          <h2>Edit course</h2>
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
              <div className="form-row">
                <label>Course code<input required value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} /></label>
                <label>Access level
                  <select value={form.level ?? 100} onChange={(e) => set("level", Number(e.target.value))}>
                    {levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </label>
              </div>
              <label>Title<input required minLength={3} value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} /></label>
              <label>Short description<textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="A short overview shown on course cards…" /></label>
              <div className="form-row">
                <label>Training category
                  <select value={form.trainingCategory ?? "Academy"} onChange={(e) => set("trainingCategory", e.target.value)}>
                    {trainingCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label>Delivery mode
                  <select value={form.deliveryMode} onChange={(e) => set("deliveryMode", e.target.value as DeliveryMode)}>
                    {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="filter-toggle">
                <input type="checkbox" checked={form.requiresPayment ?? true} onChange={(e) => set("requiresPayment", e.target.checked)} />
                Requires payment
              </label>
            </>
          )}

          {tab === "overview" && (
            <>
              <p className="form-hint">This information is shown on the public course landing page that learners see before enrolling.</p>
              <label>Thumbnail image URL<input value={form.thumbnailUrl ?? ""} onChange={(e) => set("thumbnailUrl", e.target.value)} placeholder="https://…" /></label>
              <label>Banner image URL<input value={form.bannerUrl ?? ""} onChange={(e) => set("bannerUrl", e.target.value)} placeholder="https://… (wide hero image)" /></label>
              <label>
                What you'll learn
                <textarea rows={5} value={form.whatYoullLearn ?? ""} onChange={(e) => set("whatYoullLearn", e.target.value)} placeholder={"One outcome per line, e.g.:\nUnderstand coordinate reference systems\nWork with GeoJSON and shapefiles"} />
              </label>
              <label>Prerequisites<textarea rows={3} value={form.prerequisites ?? ""} onChange={(e) => set("prerequisites", e.target.value)} placeholder="What should learners already know before starting?" /></label>
              <label>Who this is for<textarea rows={3} value={form.targetAudience ?? ""} onChange={(e) => set("targetAudience", e.target.value)} placeholder="Describe the ideal learner for this course." /></label>
              <div className="form-row">
                <label>Language<input value={form.language ?? ""} onChange={(e) => set("language", e.target.value)} placeholder="e.g. English" /></label>
                <label>Estimated hours
                  <input type="number" min={0} step={0.5} value={form.estimatedHours ?? ""} onChange={(e) => set("estimatedHours", e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 12" />
                </label>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="primary-button" disabled={saving}>
              {saving ? <Loader2 className="spin" size={16} /> : null}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
