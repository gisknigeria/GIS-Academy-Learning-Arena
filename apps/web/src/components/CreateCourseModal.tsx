import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCourseAccessLevelOptions, trainingCategories } from "../data/knowledgeHub";
import { COURSE_PREFIX_OPTIONS, normalizeCourseCode } from "../lib/course-code-utils";
import { coursesApi } from "../lib/courses-api";
import type { Course, CreateCoursePayload, DeliveryMode } from "../types/course";

type Props = {
  onClose: () => void;
  onCreated: (course: Course) => void;
};

const DELIVERY_MODES: { value: DeliveryMode; label: string }[] = [
  { value: "E_LEARNING", label: "E-Learning" },
  { value: "ONSITE", label: "Onsite" },
  { value: "HYBRID", label: "Hybrid" },
];

export function CreateCourseModal({ onClose, onCreated }: Props) {
  const { token } = useAuth();

  const [form, setForm] = useState<CreateCoursePayload>({
    code: "",
    title: "",
    description: "",
    trainingCategory: "Academy",
    level: 100,
    deliveryMode: "E_LEARNING",
    requiresPayment: true,
  });
  const [coursePrefix, setCoursePrefix] = useState(COURSE_PREFIX_OPTIONS[0]);
  const [customPrefix, setCustomPrefix] = useState("");
  const accessLevelOptions = useMemo(() => getCourseAccessLevelOptions(form.trainingCategory), [form.trainingCategory]);
  const selectedLevel = accessLevelOptions.find((option) => option.value === form.level)?.value ?? accessLevelOptions[0]?.value ?? 100;
  const previewCode = `${normalizeCourseCode(customPrefix.trim().toUpperCase() || coursePrefix)}${selectedLevel}`;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof CreateCoursePayload>(key: K, value: CreateCoursePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function getSelectedPrefix() {
    return customPrefix.trim().toUpperCase() || coursePrefix;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const prefix = normalizeCourseCode(getSelectedPrefix());
      const code = form.code.trim().toUpperCase() || `${prefix}${form.level ?? 100}`;
      const payload: CreateCoursePayload = {
        ...form,
        code,
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        trainingCategory: form.trainingCategory || undefined,
        level: selectedLevel,
        requiresPayment: true,
      };
      const created = await coursesApi.create(token!, payload);
      onCreated(created);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create course.";
      try {
        const parsed = JSON.parse(msg) as { message?: string | string[] };
        const text = Array.isArray(parsed.message)
          ? parsed.message.join(", ")
          : (parsed.message ?? msg);
        setError(text);
      } catch {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create course">
      <div className="modal-panel">
        <div className="modal-header">
          <h2>New course</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-row">
            <label>
              Course prefix
              <select
                value={customPrefix ? "custom" : coursePrefix}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setCustomPrefix(coursePrefix);
                    setCoursePrefix(COURSE_PREFIX_OPTIONS[0]);
                  } else {
                    setCoursePrefix(e.target.value);
                    setCustomPrefix("");
                  }
                }}
              >
                {COURSE_PREFIX_OPTIONS.map((prefix) => (
                  <option key={prefix} value={prefix}>{prefix}</option>
                ))}
                <option value="custom">Add new prefix</option>
              </select>
            </label>
            {customPrefix !== "" || (customPrefix === "" && coursePrefix === "custom") ? (
              <label>
                New prefix
                <input
                  placeholder="e.g. GSD"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())}
                  style={{ textTransform: "uppercase" }}
                />
              </label>
            ) : null}
          </div>

          <div className="form-row">
            <label>
              Course code
              <input
                required
                placeholder="e.g. LIT101"
                value={form.code || previewCode}
                onChange={(e) => set("code", e.target.value)}
                style={{ textTransform: "uppercase" }}
              />
            </label>
            <label>
              Access level
              <select
                value={selectedLevel}
                onChange={(e) => set("level", Number(e.target.value))}
              >
                {accessLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="form-hint">Preview: {previewCode}</p>

          <label>
            Title
            <input
              required
              placeholder="e.g. Geospatial Analytics"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </label>

          <label>
            Description
            <textarea
              placeholder="A short overview of what learners will gain from this course…"
              value={form.description}
              rows={3}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>

          <label>
            Training category
            <select
              value={form.trainingCategory ?? "Academy"}
              onChange={(e) => set("trainingCategory", e.target.value)}
            >
              {trainingCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              Delivery mode
              <select
                value={form.deliveryMode}
                onChange={(e) => set("deliveryMode", e.target.value as DeliveryMode)}
              >
                {DELIVERY_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Creating…" : "Create course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
