import { X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { trainingCategories } from "../data/knowledgeHub";
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
    level: undefined,
    deliveryMode: "E_LEARNING",
    requiresPayment: true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof CreateCoursePayload>(key: K, value: CreateCoursePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: CreateCoursePayload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        trainingCategory: form.trainingCategory || undefined,
        level: form.level ?? undefined,
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
              Course code
              <input
                required
                placeholder="e.g. GIS200"
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                style={{ textTransform: "uppercase" }}
              />
            </label>
            <label>
              Level
              <input
                type="number"
                placeholder="e.g. 200"
                min={100}
                max={999}
                value={form.level ?? ""}
                onChange={(e) =>
                  set("level", e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
              />
            </label>
          </div>

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

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.requiresPayment}
                onChange={(e) => set("requiresPayment", e.target.checked)}
              />
              Requires payment
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
