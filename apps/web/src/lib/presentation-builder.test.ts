import { describe, expect, it } from "vitest";
import { createDefaultDeck, parsePresentationDeck, serializePresentationDeck } from "./presentation-builder";

describe("presentation deck helpers", () => {
  it("round-trips a deck through serialization", () => {
    const deck = createDefaultDeck();
    deck.slides = [
      {
        id: "slide-1",
        title: "Welcome",
        body: "Start the session with a short framing question.",
        templateId: "title",
        accent: "#2563eb",
        notes: "Introduce the theme.",
      },
    ];

    const serialized = serializePresentationDeck(deck);
    const parsed = parsePresentationDeck(serialized);

    expect(parsed).toEqual(deck);
  });
});
