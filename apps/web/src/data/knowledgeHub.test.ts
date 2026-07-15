// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { applyKnowledgeHubPreferences, defaultKnowledgeHubPreferences, KNOWLEDGE_HUB_STORAGE_KEY, saveKnowledgeHubPreferences } from "./knowledgeHub";

describe("knowledge hub preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-appearance");
    document.documentElement.removeAttribute("data-language-preference");
    document.documentElement.style.cssText = "";
  });

  it("applies font, appearance, language, and favorite theme immediately", () => {
    const preferences = {
      ...defaultKnowledgeHubPreferences,
      favorite: "Arsenal",
      fontPreference: "DM Sans",
      appearanceMode: "Dark" as const,
      languagePreference: "Yoruba",
    };

    applyKnowledgeHubPreferences(preferences);

    expect(document.documentElement.dataset.appearance).toBe("dark");
    expect(document.documentElement.dataset.favoriteTheme).toBe("arsenal");
    expect(document.documentElement.lang).toBe("yo");
    expect(document.documentElement.style.getPropertyValue("--app-font")).toContain("DM Sans");
  });

  it("exposes richer font families and localized metadata", () => {
    const preferences = {
      ...defaultKnowledgeHubPreferences,
      fontPreference: "Playfair Display",
      languagePreference: "French",
    };

    applyKnowledgeHubPreferences(preferences);

    expect(document.documentElement.dataset.languagePreference).toBe("French");
    expect(document.documentElement.style.getPropertyValue("--app-font")).toContain("Playfair Display");
  });

  it("persists preferences and emits the live-update event", () => {
    const preferences = { ...defaultKnowledgeHubPreferences, appearanceMode: "System" as const };
    let detail = null;
    window.addEventListener("knowledge-hub:preferences-updated", (event) => { detail = (event as CustomEvent).detail; }, { once: true });

    saveKnowledgeHubPreferences(preferences);

    expect(JSON.parse(localStorage.getItem(KNOWLEDGE_HUB_STORAGE_KEY) ?? "{}").appearanceMode).toBe("System");
    expect(detail).toEqual(preferences);
  });
});
