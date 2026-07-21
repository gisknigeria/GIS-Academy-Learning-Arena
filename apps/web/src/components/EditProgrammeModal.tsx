import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { curriculumApi } from "../lib/curriculum-api";
import type { LearningPathway, TrainingCategory } from "../types/curriculum";

type Props = { programme: LearningPathway; categories: TrainingCategory[]; onClose: () => void; onSaved: () => void };
type Tab = "basic" | "overview";

export function EditProgrammeModal({ programme, categories, onClose, onSaved }: Props) {
  const { token } = useAuth();
  const [tab, setTab]   = useState<Tab>("basic");
  const [name, setName] = useState(programme.name);
  const [description,    setDescription]    = useState(programme.description    ?? "");
  const [categoryId,     setCategoryId]     = useState(programme.categoryId);
  const [thumbnailUrl,   setThumbnailUrl]   = useState(programme.thumbnailUrl   ?? "");
  const [whatYoullLearn, setWhatYoullLearn] = useState(programme.whatYoullLearn ?? "");
  const [prerequisites,  setPrerequisites]  = useState(programme.prerequisites  ?? "");
  const [targetAudience, setTargetAudience] = useState(programme.targetAudience ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await curriculumApi.updateProgramme(token, programme.id, {
        name:           name.trim(),
        description:    description.trim()    || undefined,
        categoryId,
        thumbnailUrl:   thumbnailUrl.trim()   || undefined,
        whatYoullLearn: whatYoullLearn.trim() || undefined,
        prerequisites:  prerequisites.trim()  || undefined,
        targetAudience: targetAudience.trim() || undefined,
      });
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the programme.");
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit programme">
      <div className="modal-panel modal-panel--wide">
        <div className="modal-header">
          <h2>Edit programme</h2>
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
              <label>Programme name<input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label>Short description<textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
              <label>Training category
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <p className="form-hint">Use the course controls under each stage to add or remove courses.</p>
            </>
          )}

          {tab === "overview" && (
            <>
              <p className="form-hint">This information appears on the programme landing page learners see before enrolling.</p>
              <label>Thumbnail image URL<input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://…" /></label>
              <label>
                What you'll learn
                <textarea rows={5} value={whatYoullLearn} onChange={(e) => setWhatYoullLearn(e.target.value)} placeholder={"One outcome per line"} />
              </label>
              <label>Prerequisites<textarea rows={3} value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} placeholder="What should learners already know?" /></label>
              <label>Who this is for<textarea rows={3} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Describe the ideal learner." /></label>
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
