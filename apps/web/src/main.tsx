import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { LocalizationProvider } from "./context/LocalizationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { applyKnowledgeHubPreferences, loadKnowledgeHubPreferences } from "./data/knowledgeHub";
import { installChunkLoadRecovery } from "./lib/chunk-load-recovery";
import "./styles.css";

// Recover tabs that still reference hashed bundles from a previous deployment.
installChunkLoadRecovery();

// Apply immediately before React boots so there's no flash of default theme
applyKnowledgeHubPreferences(loadKnowledgeHubPreferences());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LocalizationProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </LocalizationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
