import { ChevronLeft, ChevronRight, Eye, EyeOff, Layers, PlusCircle, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ACCENT_PRESETS,
  PRESENTATION_TEMPLATES,
  createDefaultDeck,
  serializePresentationDeck,
  type PresentationDeck,
  type PresentationSlide,
  type PresentationTemplate,
  type PresentationTemplateId,
} from "../lib/presentation-builder";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

function newSlide(index: number, templateId: PresentationTemplateId = "title"): PresentationSlide {
  return {
    id: `slide-${Date.now()}-${index}`,
    title: `Slide ${index}`,
    body: "Add your teaching points here.",
    subtitle: "",
    bodyRight: "",
    statValue: "",
    statLabel: "",
    items: ["Item one", "Item two", "Item three"],
    templateId,
    accent: "#2563eb",
    notes: "",
  };
}

/* ── Template picker modal ─────────────────────────────── */
function TemplatePicker({
  current,
  onSelect,
  onClose,
}: {
  current: PresentationTemplateId;
  onSelect: (id: PresentationTemplateId) => void;
  onClose: () => void;
}) {
  return (
    <div className="pb-template-picker-backdrop" role="dialog" aria-modal="true" aria-label="Choose a slide template">
      <div className="pb-template-picker">
        <div className="pb-template-picker__header">
          <strong>Choose a template</strong>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close template picker">
            <X size={17} />
          </button>
        </div>
        <div className="pb-template-grid">
          {PRESENTATION_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className={"pb-template-card" + (tpl.id === current ? " is-selected" : "")}
              onClick={() => { onSelect(tpl.id); onClose(); }}
            >
              <span className="pb-template-card__thumb">{tpl.thumb}</span>
              <strong>{tpl.name}</strong>
              <small>{tpl.description}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Slide preview renderer ────────────────────────────── */
function SlidePreview({ slide, template }: { slide: PresentationSlide; template: PresentationTemplate }) {
  const items = slide.items?.filter(Boolean) ?? [];

  return (
    <div className={`pb-preview pb-preview--${template.layout}`} style={{ "--slide-accent": slide.accent } as React.CSSProperties}>
      <div className="pb-preview__accent-bar" />
      <div className="pb-preview__content">
        {/* eyebrow / subtitle */}
        {slide.subtitle && <span className="pb-preview__eyebrow">{slide.subtitle}</span>}

        {/* title */}
        <h3 className="pb-preview__title">{slide.title || "Slide title"}</h3>

        {/* body variants */}
        {template.id === "two-column" || template.id === "comparison" ? (
          <div className="pb-preview__two-col">
            <div className="pb-preview__col">
              <p>{slide.body || "Left column content"}</p>
            </div>
            <div className="pb-preview__col">
              <p>{slide.bodyRight || "Right column content"}</p>
            </div>
          </div>
        ) : template.id === "problem-solution" ? (
          <div className="pb-preview__two-col pb-preview__two-col--labeled">
            <div className="pb-preview__col">
              <span className="pb-preview__col-label">Problem</span>
              <p>{slide.body || "Describe the problem"}</p>
            </div>
            <div className="pb-preview__col">
              <span className="pb-preview__col-label">Solution</span>
              <p>{slide.bodyRight || "Describe the solution"}</p>
            </div>
          </div>
        ) : template.id === "data-highlight" ? (
          <div className="pb-preview__stat">
            <span className="pb-preview__stat-value">{slide.statValue || "0"}</span>
            <span className="pb-preview__stat-label">{slide.statLabel || "key metric"}</span>
            {slide.body ? <p>{slide.body}</p> : null}
          </div>
        ) : template.id === "steps" || template.id === "agenda" || template.id === "timeline" ? (
          <ol className="pb-preview__steps">
            {items.slice(0, 5).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        ) : template.id === "team" ? (
          <ul className="pb-preview__team">
            {items.slice(0, 4).map((item, i) => (
              <li key={i}><span className="pb-preview__avatar">{item[0]?.toUpperCase() ?? "?"}</span>{item}</li>
            ))}
          </ul>
        ) : template.id === "quote" ? (
          <blockquote className="pb-preview__quote">
            <p>"{slide.body || "Enter a memorable quote or insight."}"</p>
          </blockquote>
        ) : template.id === "key-takeaway" || template.id === "cta" ? (
          <div className="pb-preview__takeaway">
            <p>{slide.body || "The one thing learners should remember."}</p>
          </div>
        ) : template.id === "image-focus" ? (
          <div className="pb-preview__image-box">
            <span>🖼️</span>
            <p>{slide.body || "Image or diagram caption"}</p>
          </div>
        ) : template.id === "section-divider" ? (
          <p className="pb-preview__divider-sub">{slide.body || "Section subtitle"}</p>
        ) : (
          <p className="pb-preview__body">{slide.body || "Add your teaching points here."}</p>
        )}

        {/* template badge */}
        <span className="pb-preview__badge">{template.thumb} {template.name}</span>
      </div>
    </div>
  );
}

/* ── Slide editor form fields ──────────────────────────── */
function SlideEditor({
  slide,
  template,
  onUpdate,
  onRemove,
  canRemove,
  onPickTemplate,
}: {
  slide: PresentationSlide;
  template: PresentationTemplate;
  onUpdate: (s: PresentationSlide) => void;
  onRemove: () => void;
  canRemove: boolean;
  onPickTemplate: () => void;
}) {
  const hasItems = ["steps", "agenda", "timeline", "team"].includes(slide.templateId);
  const hasTwoCols = ["two-column", "comparison", "problem-solution"].includes(slide.templateId);
  const hasStat = slide.templateId === "data-highlight";
  const hasSubtitle = ["title", "section-divider", "cta"].includes(slide.templateId);

  function setItems(items: string[]) { onUpdate({ ...slide, items }); }

  return (
    <div className="pb-slide-editor">
      {/* Template row */}
      <div className="pb-slide-editor__template-row">
        <button type="button" className="pb-template-trigger" onClick={onPickTemplate}>
          <span>{template.thumb}</span>
          <span>{template.name}</span>
          <span className="pb-template-trigger__change">Change template</span>
        </button>
        <div className="pb-accent-row">
          <span>Accent</span>
          <div className="pb-accent-presets">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={"pb-accent-dot" + (slide.accent === c ? " is-active" : "")}
                style={{ background: c }}
                onClick={() => onUpdate({ ...slide, accent: c })}
                aria-label={`Accent ${c}`}
                title={c}
              />
            ))}
            <input
              type="color"
              value={slide.accent}
              onChange={(e) => onUpdate({ ...slide, accent: e.target.value })}
              className="pb-accent-custom"
              title="Custom colour"
              aria-label="Custom accent colour"
            />
          </div>
        </div>
      </div>

      {hasSubtitle && (
        <label className="pb-field">
          Subtitle / eyebrow
          <input value={slide.subtitle ?? ""} onChange={(e) => onUpdate({ ...slide, subtitle: e.target.value })} placeholder="e.g. Module 1 · Introduction" />
        </label>
      )}

      <label className="pb-field">
        Slide title
        <input value={slide.title} onChange={(e) => onUpdate({ ...slide, title: e.target.value })} placeholder="Slide headline" />
      </label>

      {hasStat && (
        <div className="pb-field-row">
          <label className="pb-field">
            Stat / number
            <input value={slide.statValue ?? ""} onChange={(e) => onUpdate({ ...slide, statValue: e.target.value })} placeholder="e.g. 84%" />
          </label>
          <label className="pb-field">
            Stat label
            <input value={slide.statLabel ?? ""} onChange={(e) => onUpdate({ ...slide, statLabel: e.target.value })} placeholder="e.g. of learners passed" />
          </label>
        </div>
      )}

      {hasTwoCols ? (
        <div className="pb-field-row">
          <label className="pb-field">
            {slide.templateId === "problem-solution" ? "Problem" : "Left column"}
            <textarea rows={3} value={slide.body} onChange={(e) => onUpdate({ ...slide, body: e.target.value })} placeholder="Left content" />
          </label>
          <label className="pb-field">
            {slide.templateId === "problem-solution" ? "Solution" : "Right column"}
            <textarea rows={3} value={slide.bodyRight ?? ""} onChange={(e) => onUpdate({ ...slide, bodyRight: e.target.value })} placeholder="Right content" />
          </label>
        </div>
      ) : !hasStat || slide.templateId === "data-highlight" ? (
        <label className="pb-field">
          {hasStat ? "Supporting text" : "Body / content"}
          <textarea rows={4} value={slide.body} onChange={(e) => onUpdate({ ...slide, body: e.target.value })} placeholder="Main slide content" />
        </label>
      ) : null}

      {hasItems && (
        <div className="pb-items-editor">
          <strong>Items</strong>
          {(slide.items ?? []).map((item, i) => (
            <div key={i} className="pb-items-editor__row">
              <input value={item} onChange={(e) => { const next = [...(slide.items ?? [])]; next[i] = e.target.value; setItems(next); }} placeholder={`Item ${i + 1}`} />
              <button type="button" className="icon-button danger" onClick={() => setItems((slide.items ?? []).filter((_, idx) => idx !== i))} aria-label="Remove item"><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" className="secondary-button" style={{ marginTop: 4 }} onClick={() => setItems([...(slide.items ?? []), ""])}>
            <PlusCircle size={14} /> Add item
          </button>
        </div>
      )}

      <label className="pb-field">
        Trainer notes
        <textarea rows={2} value={slide.notes} onChange={(e) => onUpdate({ ...slide, notes: e.target.value })} placeholder="Private notes visible only to the trainer" />
      </label>

      {canRemove && (
        <div className="pb-slide-editor__actions">
          <button type="button" className="secondary-button danger-outline" onClick={onRemove}>
            <Trash2 size={14} /> Remove slide
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */
export function PresentationDeckBuilder({ value, onChange, onClear }: Props) {
  const [deck, setDeck] = useState<PresentationDeck>(() => createDefaultDeck());
  const [activeSlideId, setActiveSlideId] = useState<string>("");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length) {
        const next: PresentationDeck = {
          title: typeof parsed.title === "string" ? parsed.title : "New lesson deck",
          description: typeof parsed.description === "string" ? parsed.description : "",
          slides: parsed.slides as PresentationSlide[],
        };
        setDeck(next);
        setActiveSlideId(next.slides[0]?.id ?? "");
        return;
      }
    } catch { /* fall through */ }
    const fresh = createDefaultDeck();
    setDeck(fresh);
    setActiveSlideId(fresh.slides[0]?.id ?? "");
  }, [value]);

  const activeSlide = useMemo(
    () => deck.slides.find((s) => s.id === activeSlideId) ?? deck.slides[0],
    [activeSlideId, deck.slides],
  );

  const activeTemplate = useMemo(
    () => PRESENTATION_TEMPLATES.find((t) => t.id === activeSlide?.templateId) ?? PRESENTATION_TEMPLATES[0],
    [activeSlide],
  );

  function push(next: PresentationDeck) {
    setDeck(next);
    onChange(serializePresentationDeck(next));
  }

  function updateSlide(next: PresentationSlide) {
    push({ ...deck, slides: deck.slides.map((s) => (s.id === next.id ? next : s)) });
  }

  function addSlide() {
    const s = newSlide(deck.slides.length + 1);
    push({ ...deck, slides: [...deck.slides, s] });
    setActiveSlideId(s.id);
  }

  function removeSlide(id: string) {
    if (deck.slides.length <= 1) return;
    const next = { ...deck, slides: deck.slides.filter((s) => s.id !== id) };
    push(next);
    setActiveSlideId(next.slides[0]?.id ?? "");
  }

  function moveSlide(id: string, dir: -1 | 1) {
    const idx = deck.slides.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const next = [...deck.slides];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    push({ ...deck, slides: next });
  }

  /* preview navigation */
  const previewSlide = deck.slides[previewIndex] ?? deck.slides[0];
  const previewTemplate = PRESENTATION_TEMPLATES.find((t) => t.id === previewSlide?.templateId) ?? PRESENTATION_TEMPLATES[0];

  return (
    <div className="pb-root">
      {/* ── Header ── */}
      <div className="pb-header">
        <div className="pb-header__meta">
          <Layers size={17} />
          <div>
            <input
              className="pb-deck-title-input"
              value={deck.title}
              onChange={(e) => push({ ...deck, title: e.target.value })}
              placeholder="Deck title"
              aria-label="Deck title"
            />
            <input
              className="pb-deck-desc-input"
              value={deck.description}
              onChange={(e) => push({ ...deck, description: e.target.value })}
              placeholder="Short deck description"
              aria-label="Deck description"
            />
          </div>
        </div>
        <div className="pb-header__actions">
          <button
            type="button"
            className={"secondary-button" + (previewMode ? " is-active" : "")}
            onClick={() => { setPreviewMode((p) => !p); setPreviewIndex(0); }}
          >
            {previewMode ? <EyeOff size={15} /> : <Eye size={15} />}
            {previewMode ? "Exit preview" : "Preview deck"}
          </button>
          {onClear ? (
            <button type="button" className="secondary-button" onClick={onClear}>
              Clear deck
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Full-screen preview mode ── */}
      {previewMode ? (
        <div className="pb-preview-mode">
          <div className="pb-preview-mode__stage">
            <SlidePreview slide={previewSlide} template={previewTemplate} />
            {previewSlide.notes && (
              <div className="pb-preview-mode__notes">
                <strong>Trainer notes</strong>
                <p>{previewSlide.notes}</p>
              </div>
            )}
          </div>
          <div className="pb-preview-mode__nav">
            <button type="button" className="icon-button" onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))} disabled={previewIndex === 0} aria-label="Previous slide">
              <ChevronLeft size={20} />
            </button>
            <span>{previewIndex + 1} / {deck.slides.length}</span>
            <button type="button" className="icon-button" onClick={() => setPreviewIndex((i) => Math.min(deck.slides.length - 1, i + 1))} disabled={previewIndex === deck.slides.length - 1} aria-label="Next slide">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="pb-preview-mode__thumbs">
            {deck.slides.map((s, i) => {
              const t = PRESENTATION_TEMPLATES.find((tpl) => tpl.id === s.templateId) ?? PRESENTATION_TEMPLATES[0];
              return (
                <button
                  key={s.id}
                  type="button"
                  className={"pb-preview-thumb" + (i === previewIndex ? " is-active" : "")}
                  onClick={() => setPreviewIndex(i)}
                >
                  <span>{t.thumb}</span>
                  <small>{i + 1}. {s.title || "Untitled"}</small>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Editor mode ── */
        <div className="pb-editor">
          {/* Slide list sidebar */}
          <div className="pb-sidebar">
            {deck.slides.map((s, i) => {
              const t = PRESENTATION_TEMPLATES.find((tpl) => tpl.id === s.templateId) ?? PRESENTATION_TEMPLATES[0];
              return (
                <div key={s.id} className={"pb-slide-thumb" + (activeSlide?.id === s.id ? " is-active" : "")}>
                  <button type="button" className="pb-slide-thumb__body" onClick={() => setActiveSlideId(s.id)}>
                    <span className="pb-slide-thumb__num">{i + 1}</span>
                    <span className="pb-slide-thumb__emoji">{t.thumb}</span>
                    <div>
                      <strong>{s.title || `Slide ${i + 1}`}</strong>
                      <small>{t.name}</small>
                    </div>
                  </button>
                  <div className="pb-slide-thumb__controls">
                    <button type="button" className="icon-button" onClick={() => moveSlide(s.id, -1)} disabled={i === 0} aria-label="Move up" title="Move up"><ChevronLeft size={13} /></button>
                    <button type="button" className="icon-button" onClick={() => moveSlide(s.id, 1)} disabled={i === deck.slides.length - 1} aria-label="Move down" title="Move down"><ChevronRight size={13} /></button>
                  </div>
                </div>
              );
            })}
            <button type="button" className="pb-add-slide" onClick={addSlide}>
              <PlusCircle size={15} /> Add slide
            </button>
          </div>

          {/* Editor + preview panel */}
          {activeSlide ? (
            <div className="pb-main">
              <div className="pb-main__live-preview">
                <SlidePreview slide={activeSlide} template={activeTemplate} />
              </div>
              <SlideEditor
                slide={activeSlide}
                template={activeTemplate}
                onUpdate={updateSlide}
                onRemove={() => removeSlide(activeSlide.id)}
                canRemove={deck.slides.length > 1}
                onPickTemplate={() => setShowTemplatePicker(true)}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Template picker modal */}
      {showTemplatePicker && activeSlide ? (
        <TemplatePicker
          current={activeSlide.templateId}
          onSelect={(id) => updateSlide({ ...activeSlide, templateId: id })}
          onClose={() => setShowTemplatePicker(false)}
        />
      ) : null}
    </div>
  );
}
