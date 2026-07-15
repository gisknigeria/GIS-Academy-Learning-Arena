import { useEffect, useMemo, useState } from "react";
import { createDefaultDeck, PRESENTATION_TEMPLATES, serializePresentationDeck, type PresentationDeck, type PresentationSlide, type PresentationTemplateId } from "../lib/presentation-builder";

type PresentationDeckBuilderProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

function createSlide(index: number): PresentationSlide {
  return {
    id: `slide-${Date.now()}-${index}`,
    title: `Slide ${index}`,
    body: "Add your teaching points, examples, or discussion prompts here.",
    templateId: "title",
    accent: "#2563eb",
    notes: "Trainer notes",
  };
}

function PreviewSlide({ slide }: { slide: PresentationSlide }) {
  return (
    <div className={`presentation-preview presentation-preview--${slide.templateId}`} style={{ borderColor: slide.accent }}>
      <div className="presentation-preview__accent" style={{ background: slide.accent }} />
      <div className="presentation-preview__body">
        <span className="presentation-preview__pill">{PRESENTATION_TEMPLATES.find((template) => template.id === slide.templateId)?.name ?? "Template"}</span>
        <h4>{slide.title || "Slide title"}</h4>
        <p>{slide.body || "Add a short teaching point here."}</p>
        {slide.templateId === "steps" ? (
          <ul>
            <li>Step 1</li>
            <li>Step 2</li>
            <li>Step 3</li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function PresentationDeckBuilder({ value, onChange, onClear }: PresentationDeckBuilderProps) {
  const [deck, setDeck] = useState<PresentationDeck>(() => createDefaultDeck());
  const [activeSlideId, setActiveSlideId] = useState<string>("");

  useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length) {
        const nextDeck = {
          title: typeof parsed.title === "string" ? parsed.title : "New lesson deck",
          description: typeof parsed.description === "string" ? parsed.description : "Editable trainer presentation",
          slides: parsed.slides as PresentationSlide[],
        };
        setDeck(nextDeck);
        setActiveSlideId(nextDeck.slides[0]?.id ?? "");
        return;
      }
    } catch {
      // fall back to a fresh editable deck if the value is not a serialized deck yet
    }
    setDeck(createDefaultDeck());
    setActiveSlideId("");
  }, [value]);

  const activeSlide = useMemo(
    () => deck.slides.find((slide) => slide.id === activeSlideId) ?? deck.slides[0],
    [activeSlideId, deck.slides],
  );

  function updateDeck(nextDeck: PresentationDeck) {
    setDeck(nextDeck);
    onChange(serializePresentationDeck(nextDeck));
  }

  function updateSlide(nextSlide: PresentationSlide) {
    const nextDeck = {
      ...deck,
      slides: deck.slides.map((slide) => (slide.id === nextSlide.id ? nextSlide : slide)),
    };
    updateDeck(nextDeck);
  }

  function addSlide() {
    const nextSlide = createSlide(deck.slides.length + 1);
    const nextDeck = { ...deck, slides: [...deck.slides, nextSlide] };
    updateDeck(nextDeck);
    setActiveSlideId(nextSlide.id);
  }

  function removeSlide(slideId: string) {
    if (deck.slides.length <= 1) return;
    const nextDeck = { ...deck, slides: deck.slides.filter((slide) => slide.id !== slideId) };
    updateDeck(nextDeck);
    setActiveSlideId(nextDeck.slides[0]?.id ?? "");
  }

  function updateActiveSlide(updater: (slide: PresentationSlide) => PresentationSlide) {
    if (!activeSlide) return;
    updateSlide(updater(activeSlide));
  }

  return (
    <div className="presentation-builder">
      <div className="presentation-builder__header">
        <div>
          <strong>Create an editable slide deck</strong>
          <span>Choose a template, write the content, and keep it editable for the lesson.</span>
        </div>
        {onClear ? (
          <button type="button" className="secondary-button" onClick={onClear}>
            Clear deck
          </button>
        ) : null}
      </div>

      <div className="presentation-builder__meta">
        <label>
          Deck title
          <input
            value={deck.title}
            onChange={(event) => updateDeck({ ...deck, title: event.target.value })}
            placeholder="e.g. Climate resilience lesson"
          />
        </label>
        <label>
          Deck description
          <input
            value={deck.description}
            onChange={(event) => updateDeck({ ...deck, description: event.target.value })}
            placeholder="e.g. Trainer outline for the session"
          />
        </label>
      </div>

      <div className="presentation-builder__editor">
        <div className="presentation-builder__slide-list">
          {deck.slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={activeSlide?.id === slide.id ? "presentation-builder__slide-card is-active" : "presentation-builder__slide-card"}
              onClick={() => setActiveSlideId(slide.id)}
            >
              <span>{index + 1}</span>
              <div>
                <strong>{slide.title || `Slide ${index + 1}`}</strong>
                <small>{PRESENTATION_TEMPLATES.find((template) => template.id === slide.templateId)?.name ?? "Template"}</small>
              </div>
            </button>
          ))}
          <button type="button" className="presentation-builder__add-slide" onClick={addSlide}>
            + Add slide
          </button>
        </div>

        {activeSlide ? (
          <div className="presentation-builder__slide-editor">
            <div className="presentation-builder__template-row">
              <label>
                Template
                <select
                  value={activeSlide.templateId}
                  onChange={(event) => updateActiveSlide((slide) => ({ ...slide, templateId: event.target.value as PresentationTemplateId }))}
                >
                  {PRESENTATION_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Accent color
                <input
                  type="color"
                  value={activeSlide.accent}
                  onChange={(event) => updateActiveSlide((slide) => ({ ...slide, accent: event.target.value }))}
                />
              </label>
            </div>
            <label>
              Slide title
              <input
                value={activeSlide.title}
                onChange={(event) => updateActiveSlide((slide) => ({ ...slide, title: event.target.value }))}
              />
            </label>
            <label>
              Slide body
              <textarea
                rows={4}
                value={activeSlide.body}
                onChange={(event) => updateActiveSlide((slide) => ({ ...slide, body: event.target.value }))}
              />
            </label>
            <label>
              Trainer notes
              <textarea
                rows={3}
                value={activeSlide.notes}
                onChange={(event) => updateActiveSlide((slide) => ({ ...slide, notes: event.target.value }))}
              />
            </label>
            <div className="presentation-builder__actions">
              <button type="button" className="secondary-button" onClick={() => removeSlide(activeSlide.id)} disabled={deck.slides.length <= 1}>
                Remove slide
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {activeSlide ? (
        <div className="presentation-builder__preview">
          <div className="presentation-builder__preview-title">
            <strong>Preview</strong>
            <span>{deck.title}</span>
          </div>
          <PreviewSlide slide={activeSlide} />
        </div>
      ) : null}
    </div>
  );
}
