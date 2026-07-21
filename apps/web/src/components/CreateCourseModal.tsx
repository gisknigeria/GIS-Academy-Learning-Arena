import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCourseAccessLevelOptions, trainingCategories } from "../data/knowledgeHub";
import { COURSE_PREFIX_OPTIONS, normalizeCourseCode } from "../lib/course-code-utils";
import { coursesApi } from "../lib/courses-api";
import type { Course, CreateCoursePayload, DeliveryMode } from "../types/course";

type Props = { onClose: () => void; onCreated: (course: Course) => void };
type Tab = "basic" | "overview";

const DELIVERY_MODES: { value: DeliveryMode; label: string }[] = [
  { value: "E_LEARNING", label: "E-Learning" },
  { value: "ONSITE", label: "Onsite" },
  { value: "LIVE_VIRTUAL", label: "Live virtual" },
  { value: "HYBRID", label: "Hybrid" },
];

export function CreateCourseModal({ onClose, onCreated }: Props) {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("basic");

  const [form, setForm] = useState<CreateCoursePayload>({
    code:            "",
    title:           "",
    description:     "",
    thumbnailUrl:    "",
    bannerUrl:       "",
    whatYoullLearn:  "",
    prerequisites:   "",
    targetAudience:  "",
    language:        "",
    trainingCategory: "Academy",
    level:           100,
    deliveryMode:    "E_LEARNING",
    requiresPayment: true,
  });
  const [coursePrefix, setCoursePrefix]   = useState(COURSE_PREFIX_OPTIONS[0]);
  const [customPrefix, setCustomPrefix]   = useState("");
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);

  const accessLevelOptions = useMemo(() => getCourseAccessLevelOptions(form.trainingCategory), [form.trainingCategory]);
  const selectedLevel = accessLevelOptions.find((o) => o.value === form.level)?.value ?? accessLevelOptions[0]?.value ?? 100;
  const previewCode   = `${normalizeCourseCode(customPrefix.trim().toUpperCase() || coursePrefix)}${selectedLevel}`;

  function set<K extends keyof CreateCoursePayload>(key: K, value: CreateCoursePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const prefix = normalizeCourseCode(customPrefix.trim().toUpperCase() || coursePrefix);
      const code   = form.code.trim().toUpperCase() || `${prefix}${selectedLevel}`;
      const created = await coursesApi.create(token!, {
        ...form,
        code,
        title:           form.title.trim(),
        description:     form.description?.trim()    || undefined,
        thumbnailUrl:    form.thumbnailUrl?.trim()   || undefined,
        bannerUrl:       form.bannerUrl?.trim()      || undefined,
        whatYoullLearn:  form.whatYoullLearn?.trim() || undefined,
        prerequisites:   form.prerequisites?.trim()  || undefined,
        targetAudience:  form.targetAudience?.trim() || undefined,
        language:        form.language?.trim()       || undefined,
        trainingCategory: form.trainingCategory      || undefined,
        level:           selectedLevel,
        requiresPayment: form.requiresPayment,
      });
      onCreated(created);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create course.";
      try {
        const parsed = JSON.parse(msg) as { message?: string | string[] };
        const text   = Array.isArray(parsed.message) ? parsed.message.join(", ") : (parsed.message ?? msg);
        setError(text);
      } catch { setError(msg); }
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create course">
      <div className="modal-panel modal-panel--wide">
        <div className="modal-header">
          <h2>New course</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="overview-modal-tabs">
          <button type="button" className={tab === "basic"    ? "active" : ""} onClick={() => setTab("basic")}>Basic info</button>
          <button type="button" className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Overview page</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error ? <p className="form-error">{error}</p> : null}

          {/* ── Tab 1: Basic info ───────────────────────────────────────── */}
          {tab === "basic" && (
            <>
              <div className="form-row">
                <label>
                  Course prefix
                  <select
                    value={customPrefix ? "custom" : coursePrefix}
                    onChange={(e) => {
                      if (e.target.value === "custom") { setCustomPrefix(coursePrefix); setCoursePrefix(COURSE_PREFIX_OPTIONS[0]); }
                      else { setCoursePrefix(e.target.value); setCustomPrefix(""); }
                    }}
                  >
                    {COURSE_PREFIX_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    <option value="custom">Add new prefix</option>
                  </select>
                </label>
                {customPrefix !== "" && (
                  <label>
                    New prefix
                    <input placeholder="e.g. GSD" value={customPrefix} onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} />
                  </label>
                )}
              </div>

              <div className="form-row">
                <label>
                  Course code
                  <input required placeholder="e.g. LIT101" value={form.code || previewCode} onChange={(e) => set("code", e.target.value)} style={{ textTransform: "uppercase" }} />
                </label>
                <label>
                  Access level
                  <select value={selectedLevel} onChange={(e) => set("level", Number(e.target.value))}>
                    {accessLevelOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
              </div>
              <p className="form-hint">Preview: {previewCode}</p>

              <label>Title<input required placeholder="e.g. Geospatial Analytics" value={form.title} onChange={(e) => set("title", e.target.value)} /></label>
              <label>Short description<textarea placeholder="A short overview shown on course cards…" value={form.description} rows={3} onChange={(e) => set("description", e.target.value)} /></label>
              <label>
                Training category
                <select value={form.trainingCategory ?? "Academy"} onChange={(e) => set("trainingCategory", e.target.value)}>
                  {trainingCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <div className="form-row">
                <label>Delivery mode
                  <select value={form.deliveryMode} onChange={(e) => set("deliveryMode", e.target.value as DeliveryMode)}>
                    {DELIVERY_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                  </select>
                </label>
                <label className="filter-toggle">
                  <input type="checkbox" checked={form.requiresPayment ?? true} onChange={(e) => set("requiresPayment", e.target.checked)} />
                  Requires payment
                </label>
              </div>
            </>
          )}

          {/* ── Tab 2: Overview page ────────────────────────────────────── */}
          {tab === "overview" && (
            <>
              <p className="form-hint">This information appears on the public course landing page learners see before enrolling. You can fill this in now or later.</p>
              <label>Thumbnail image URL<input value={form.thumbnailUrl ?? ""} onChange={(e) => set("thumbnailUrl", e.target.value)} placeholder="https://…" /></label>
              <label>Banner image URL<input value={form.bannerUrl ?? ""} onChange={(e) => set("bannerUrl", e.target.value)} placeholder="https://… (wide hero image)" /></label>
              <label>
                What you'll learn
                <textarea rows={5} value={form.whatYoullLearn ?? ""} onChange={(e) => set("whatYoullLearn", e.target.value)} placeholder={"One outcome per line, e.g.:\nUnderstand coordinate reference systems\nWork with GeoJSON and shapefiles"} />
              </label>
              <label>Prerequisites<textarea rows={3} value={form.prerequisites ?? ""} onChange={(e) => set("prerequisites", e.target.value)} placeholder="What should learners already know?" /></label>
              <label>Who this is for<textarea rows={3} value={form.targetAudience ?? ""} onChange={(e) => set("targetAudience", e.target.value)} placeholder="Describe the ideal learner." /></label>
              <div className="form-row">
                <label>Language<input value={form.language ?? ""} onChange={(e) => set("language", e.target.value)} placeholder="e.g. English" /></label>
                <label>Estimated hours<input type="number" min={0.5} step={0.5} value={form.estimatedHours ?? ""} onChange={(e) => set("estimatedHours", e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 12" /></label>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={loading}>{loading ? "Creating…" : "Create course"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
