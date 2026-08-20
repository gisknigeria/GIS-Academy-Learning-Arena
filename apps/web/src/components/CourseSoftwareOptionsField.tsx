import { Plus, Trash2 } from "lucide-react";
import type { CourseSoftwareOption } from "../types/course";

const COMMON_SOFTWARE = ["QGIS", "ArcGIS Pro", "ArcMap", "Google Earth Pro", "AutoCAD Map 3D", "GRASS GIS", "PostGIS"];

export function CourseSoftwareOptionsField({
  enabled,
  options,
  onEnabledChange,
  onChange,
}: {
  enabled: boolean;
  options: CourseSoftwareOption[];
  onEnabledChange: (enabled: boolean) => void;
  onChange: (options: CourseSoftwareOption[]) => void;
}) {
  const update = (index: number, patch: Partial<CourseSoftwareOption>) =>
    onChange(options.map((option, optionIndex) => optionIndex === index ? { ...option, ...patch } : option));

  return <section className="course-software-field">
    <label className="filter-toggle course-software-field__toggle">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          onEnabledChange(event.target.checked);
          if (event.target.checked && !options.length) onChange([{ id: crypto.randomUUID(), name: "QGIS", version: "" }]);
        }}
      />
      This course uses software
    </label>
    <p className="form-hint">Enable this only when learners need to choose a technology-specific lesson track.</p>
    {enabled ? <div className="course-software-field__options">
      <datalist id="course-software-suggestions">{COMMON_SOFTWARE.map((name) => <option key={name} value={name} />)}</datalist>
      {options.map((option, index) => <div className="course-software-field__row" key={option.id}>
        <label>Software
          <input required list="course-software-suggestions" value={option.name} onChange={(event) => update(index, { name: event.target.value })} placeholder="e.g. QGIS or another tool" />
        </label>
        <label>Version <span className="auth-optional">(optional)</span>
          <input value={option.version ?? ""} onChange={(event) => update(index, { version: event.target.value })} placeholder="e.g. 3.34" />
        </label>
        <button type="button" className="icon-button" aria-label={`Remove ${option.name || "software"}`} onClick={() => onChange(options.filter((_, optionIndex) => optionIndex !== index))} disabled={options.length === 1}>
          <Trash2 size={16} />
        </button>
      </div>)}
      <button type="button" className="secondary-button small-button" onClick={() => onChange([...options, { id: crypto.randomUUID(), name: "", version: "" }])}>
        <Plus size={15} /> Add software
      </button>
    </div> : null}
  </section>;
}
