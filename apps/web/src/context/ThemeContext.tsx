import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  applyKnowledgeHubPreferences,
  loadKnowledgeHubPreferences,
  type KnowledgeHubPreferences,
} from "../data/knowledgeHub";

type ThemeContextValue = {
  preferences: KnowledgeHubPreferences;
};

const ThemeContext = createContext<ThemeContextValue>({
  preferences: loadKnowledgeHubPreferences(),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<KnowledgeHubPreferences>(
    () => {
      const prefs = loadKnowledgeHubPreferences();
      // Apply immediately on first render so SSR-hydration / hard-refresh is correct
      applyKnowledgeHubPreferences(prefs);
      return prefs;
    },
  );

  useEffect(() => {
    // Re-apply whenever preferences are saved from any page
    function handleUpdate(event: Event) {
      const next =
        (event as CustomEvent<KnowledgeHubPreferences>).detail ??
        loadKnowledgeHubPreferences();
      applyKnowledgeHubPreferences(next);
      setPreferences(next);
    }

    window.addEventListener("knowledge-hub:preferences-updated", handleUpdate);
    return () => window.removeEventListener("knowledge-hub:preferences-updated", handleUpdate);
  }, []);

  return (
    <ThemeContext.Provider value={{ preferences }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
