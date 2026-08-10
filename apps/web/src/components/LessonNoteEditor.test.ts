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

  it("stores an empty editor as an empty value", () => {
    expect(normalizeLessonNoteHtml("   ")).toBe("");
  });

  it("escapes plain text before inserting it as HTML", () => {
    expect(normalizeLessonNoteHtml("Use 2 < 3 & 4 > 1"))
      .toBe("<p>Use 2 &lt; 3 &amp; 4 &gt; 1</p>");
  });
});
