import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { curriculumApi } from "../lib/curriculum-api";
import type { LearningPathway, TrainingCategory } from "../types/curriculum";

type Props = {
  programme: LearningPathway;
  categories: TrainingCategory[];
  onClose: () => void;
  onSaved: () => void;
};

export function EditProgrammeModal({ programme, categories, onClose, onSaved }: Props) {
  const { token } = useAuth();
  const [name, setName] = useState(programme.name);
  const [description, setDescription] = useState(programme.description ?? "");
  const [categoryId, setCategoryId] = useState(programme.categoryId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await curriculumApi.updateProgramme(token, programme.id, {
        name: name.trim(),
        description: description.trim(),
        categoryId,
      });
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the programme.");
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit programme">
      <div className="modal-panel">
        <div className="modal-header"><h2>Edit programme</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <form className="modal-form" onSubmit={submit}>
          {error ? <p className="form-error">{error}</p> : null}
          <label>Programme name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Description<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label>Training category<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <p className="form-hint">Use the course controls under each stage to add or remove courses.</p>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : null}{saving ? "Saving..." : "Save changes"}</button></div>
        </form>
      </div>
    </div>
  );
}
