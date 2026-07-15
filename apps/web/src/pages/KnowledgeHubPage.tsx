import { Bell, CheckCircle2, Loader2, Palette, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import {
  appearanceModes,
  fontPreferences,
  getKnowledgeHubTheme,
  getPreferenceCategory,
  languagePreferences,
  loadKnowledgeHubPreferences,
  mergeKnowledgeHubPreferences,
  notificationPreferences,
  preferenceCategories,
  saveKnowledgeHubPreferences,
  type KnowledgeHubPreferences,
  type PreferenceCategoryKey,
} from "../data/knowledgeHub";
import { profileApi } from "../lib/profile-api";

export function KnowledgeHubPage() {
  const { token, refreshUser } = useAuth();
  const { t } = useLocalization();
  const [preferences, setPreferences] = useState<KnowledgeHubPreferences>(() => loadKnowledgeHubPreferences());
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const selectedCategory = getPreferenceCategory(preferences.fanCategory);
  const theme = useMemo(() => getKnowledgeHubTheme(preferences), [preferences]);

  useEffect(() => {
    if (!token) return;
    void profileApi.getMe(token).then((user) => {
      const next = mergeKnowledgeHubPreferences(loadKnowledgeHubPreferences(), user.profile);
      setPreferences(next);
      saveKnowledgeHubPreferences(next);
    }).catch(() => undefined);
  }, [token]);

  function updatePreference<K extends keyof KnowledgeHubPreferences>(key: K, value: KnowledgeHubPreferences[K]) {
    setStatus("idle");
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      saveKnowledgeHubPreferences(next);
      return next;
    });
  }

  function updateCategory(value: PreferenceCategoryKey) {
    const category = getPreferenceCategory(value);
    setStatus("idle");
    setPreferences((current) => {
      const next = { ...current, fanCategory: value, favorite: category.options[0] };
      saveKnowledgeHubPreferences(next);
      return next;
    });
  }

  async function savePreferences() {
    if (!token) return;
    setStatus("saving");
    try {
      await profileApi.updateProfile(token, {
        fanCategory: preferences.fanCategory,
        favorite: preferences.favorite,
        notificationPreference: preferences.notificationPreference,
        languagePreference: preferences.languagePreference,
        fontPreference: preferences.fontPreference,
        appearanceMode: preferences.appearanceMode,
      });
      saveKnowledgeHubPreferences(preferences);
      await refreshUser();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="knowledge-hub-page personalize-page">
      <header className="personalize-header">
        <div>
          <span className="eyebrow">{t("nav.knowledge")}</span>
          <h1>Make the app feel like yours</h1>
          <p>Choose your interests, alerts, language, reading font, and appearance.</p>
        </div>
        <div className="personalize-current">
          <b className="personalize-emblem">{theme.emblem}</b>
          <span>{selectedCategory.label}</span>
          <strong>{preferences.favorite}</strong>
        </div>
      </header>

      <section className="knowledge-grid personalize-settings-grid">
        <article className="knowledge-panel">
          <SectionHeading eyebrow="Your preferences" title="Personalize" compact />
          <div className="knowledge-form-grid personalize-form-grid" style={{ marginTop: 16 }}>
            <label>{t("personalize.interest")}
              <select value={preferences.fanCategory} onChange={(event) => updateCategory(event.target.value as PreferenceCategoryKey)}>
                {preferenceCategories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
              </select>
            </label>
            <label>{t("personalize.favorite")}
              <select value={preferences.favorite} onChange={(event) => updatePreference("favorite", event.target.value)}>
                {selectedCategory.options.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>{t("personalize.notifications")}
              <select value={preferences.notificationPreference} onChange={(event) => updatePreference("notificationPreference", event.target.value)}>
                {notificationPreferences.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>{t("personalize.language")}
              <select value={preferences.languagePreference} onChange={(event) => updatePreference("languagePreference", event.target.value)}>
                {languagePreferences.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>{t("personalize.font")}
              <select value={preferences.fontPreference} onChange={(event) => updatePreference("fontPreference", event.target.value)}>
                {fontPreferences.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>{t("personalize.appearance")}
              <select value={preferences.appearanceMode} onChange={(event) => updatePreference("appearanceMode", event.target.value as KnowledgeHubPreferences["appearanceMode"])}>
                {appearanceModes.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <div className="personalize-save-row">
            <button className="primary-button knowledge-save-button" disabled={status === "saving"} onClick={() => void savePreferences()} type="button">
              {status === "saving" ? <Loader2 className="spin" size={18} /> : status === "saved" ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {status === "saving" ? `${t("personalize.saving")}...` : status === "saved" ? t("personalize.saved") : t("personalize.save")}
            </button>
            {status === "error" ? <span className="form-error">Could not save your preferences. Please try again.</span> : null}
          </div>
        </article>

        <aside className="knowledge-panel knowledge-preview-panel">
          <SectionHeading eyebrow={t("personalize.preview")} title={theme.name} compact />
          <div className="personalize-theme-preview">
            <span className="personalize-theme-emblem">{theme.emblem}</span>
            <div>
              <strong>{preferences.favorite}</strong>
              <small>Your selected app identity</small>
              <div className="personalize-swatches" aria-label="Selected theme colours">
                {[theme.primary, theme.secondary, theme.accent, theme.highlight].map((colour) => <i key={colour} style={{ background: colour }} />)}
              </div>
            </div>
          </div>
          <div className="knowledge-theme-card"><div className="knowledge-theme-orb"><Palette size={24} /></div><div><span>Reading experience</span><strong>{preferences.fontPreference} · {preferences.appearanceMode}</strong></div></div>
          <div className="knowledge-alert-card"><Bell size={18} /><p>{preferences.notificationPreference}</p></div>
          <p className="personalize-preview-note">Theme, language, and font changes apply immediately on this device. Save to use them on your other devices.</p>
        </aside>
      </section>
    </section>
  );
}
