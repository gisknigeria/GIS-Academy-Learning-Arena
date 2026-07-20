import { describe, expect, it } from "vitest";
import { normalizeLessonNoteHtml } from "./LessonNoteEditor";

describe("normalizeLessonNoteHtml", () => {
  it("wraps plain text paragraphs in paragraph tags", () => {
    const html = normalizeLessonNoteHtml("Heading\n\nBody text");
    expect(html).toContain("<p>Heading</p>");
    expect(html).toContain("<p>Body text</p>");
  });

  it("preserves existing rich text markup", () => {
    const html = normalizeLessonNoteHtml("<h2>Heading</h2><p>Body text</p>");
    expect(html).toBe("<h2>Heading</h2><p>Body text</p>");
  });
});
