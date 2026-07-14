import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { LocalizationProvider } from "./context/LocalizationContext";
import { applyKnowledgeHubPreferences, loadKnowledgeHubPreferences } from "./data/knowledgeHub";
import "./styles.css";

applyKnowledgeHubPreferences(loadKnowledgeHubPreferences());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LocalizationProvider>
          <App />
        </LocalizationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
