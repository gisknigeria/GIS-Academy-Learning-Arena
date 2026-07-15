export type PresentationTemplateId =
  | "title"
  | "two-column"
  | "quote"
  | "steps"
  | "agenda"
  | "image-focus"
  | "data-highlight"
  | "cta"
  | "comparison"
  | "timeline"
  | "team"
  | "problem-solution"
  | "key-takeaway"
  | "section-divider"
  | "blank";

export type PresentationSlide = {
  id: string;
  title: string;
  body: string;
  templateId: PresentationTemplateId;
  accent: string;
  notes: string;
  /** Optional secondary body text (used by two-column, comparison, problem-solution) */
  bodyRight?: string;
  /** Optional items list (used by steps, agenda, timeline, team) */
  items?: string[];
  /** Optional subtitle / eyebrow */
  subtitle?: string;
  /** Optional stat / number callout (used by data-highlight) */
  statValue?: string;
  /** Optional label for the stat */
  statLabel?: string;
  /** Optional slide background colour */
  backgroundColor?: string;
  /** Optional slide text colour */
  textColor?: string;
  /** Optional slide font family */
  fontFamily?: string;
};

export type PresentationDeck = {
  title: string;
  description: string;
  slides: PresentationSlide[];
};

export type PresentationTemplate = {
  id: PresentationTemplateId;
  name: string;
  description: string;
  /** Emoji thumbnail used in the template picker */
  thumb: string;
  /** CSS modifier appended to the preview card */
  layout: string;
};

export const PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  {
    id: "title",
    name: "Title slide",
    description: "A strong opening headline with a subtitle — perfect for the first slide.",
    thumb: "🎯",
    layout: "layout-title",
  },
  {
    id: "section-divider",
    name: "Section divider",
    description: "Bold colour block for separating major topics inside a deck.",
    thumb: "📌",
    layout: "layout-divider",
  },
  {
    id: "agenda",
    name: "Agenda / outline",
    description: "Show learners what's coming with a bulleted session overview.",
    thumb: "📋",
    layout: "layout-agenda",
  },
  {
    id: "two-column",
    name: "Two-column",
    description: "Split layout for comparing ideas, examples, or parallel concepts.",
    thumb: "⬛⬜",
    layout: "layout-two-col",
  },
  {
    id: "comparison",
    name: "Before / after",
    description: "Side-by-side contrast — great for showing change or improvement.",
    thumb: "↔️",
    layout: "layout-comparison",
  },
  {
    id: "steps",
    name: "Process / steps",
    description: "Numbered walkthrough — use for workflows, instructions, or procedures.",
    thumb: "🔢",
    layout: "layout-steps",
  },
  {
    id: "timeline",
    name: "Timeline",
    description: "Horizontal or vertical sequence of events or milestones.",
    thumb: "🕐",
    layout: "layout-timeline",
  },
  {
    id: "problem-solution",
    name: "Problem → Solution",
    description: "Classic problem/solution framing for case studies and analysis.",
    thumb: "💡",
    layout: "layout-problem-solution",
  },
  {
    id: "data-highlight",
    name: "Data highlight",
    description: "Large stat or number callout — makes a key metric impossible to miss.",
    thumb: "📊",
    layout: "layout-data",
  },
  {
    id: "quote",
    name: "Quote / insight",
    description: "Memorable pull-quote or key insight displayed prominently.",
    thumb: "💬",
    layout: "layout-quote",
  },
  {
    id: "key-takeaway",
    name: "Key takeaway",
    description: "One bold message learners should remember from this slide.",
    thumb: "⭐",
    layout: "layout-takeaway",
  },
  {
    id: "image-focus",
    name: "Image focus",
    description: "Caption-style layout centred around a visual or diagram placeholder.",
    thumb: "🖼️",
    layout: "layout-image",
  },
  {
    id: "team",
    name: "Team / people",
    description: "Introduce facilitators, subject matter experts, or team members.",
    thumb: "👥",
    layout: "layout-team",
  },
  {
    id: "cta",
    name: "Call to action",
    description: "Close a section with a clear next step, task, or discussion prompt.",
    thumb: "🚀",
    layout: "layout-cta",
  },
  {
    id: "blank",
    name: "Blank canvas",
    description: "Empty slide — add your own structure in the body text.",
    thumb: "⬜",
    layout: "layout-blank",
  },
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
        subtitle: "Module introduction",
        templateId: "title",
        accent: "#2563eb",
        notes: "Welcome learners, share the session goals.",
        backgroundColor: "#ffffff",
        textColor: "#102a43",
        fontFamily: "Inter",
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

/** Default accent colours offered in the colour picker */
export const ACCENT_PRESETS = [
  "#2563eb", // blue
  "#1fa66a", // green
  "#7c3aed", // purple
  "#e9812b", // orange
  "#dc2626", // red
  "#0891b2", // cyan
  "#d97706", // amber
  "#be185d", // pink
  "#374151", // slate
  "#0c3326", // dark green
];
