export type PresentationTemplateId = "title" | "two-column" | "quote" | "steps";

export type PresentationSlide = {
  id: string;
  title: string;
  body: string;
  templateId: PresentationTemplateId;
  accent: string;
  notes: string;
};

export type PresentationDeck = {
  title: string;
  description: string;
  slides: PresentationSlide[];
};

export const PRESENTATION_TEMPLATES: Array<{ id: PresentationTemplateId; name: string; description: string }> = [
  { id: "title", name: "Title slide", description: "A simple opening slide with a strong headline." },
  { id: "two-column", name: "Two-column", description: "Good for comparing ideas, examples, or points." },
  { id: "quote", name: "Quote / insight", description: "Great for sharing a memorable takeaway." },
  { id: "steps", name: "Process / steps", description: "Useful for walkthroughs and sequential content." },
];

export function createDefaultDeck(): PresentationDeck {
  return {
    title: "New lesson deck",
    description: "Editable trainer presentation",
    slides: [
      {
        id: `slide-${Date.now()}-1`,
        title: "Lesson overview",
        body: "Introduce the topic, learning outcomes, and agenda.",
        templateId: "title",
        accent: "#2563eb",
        notes: "Trainer note",
      },
    ],
  };
}

export function serializePresentationDeck(deck: PresentationDeck): string {
  return JSON.stringify(deck);
}

export function parsePresentationDeck(value: string): PresentationDeck {
  const parsed = JSON.parse(value) as PresentationDeck;
  return {
    title: parsed.title ?? "New lesson deck",
    description: parsed.description ?? "Editable trainer presentation",
    slides: Array.isArray(parsed.slides) ? parsed.slides : [],
  };
}
