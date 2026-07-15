import { Bell, CheckCircle2, Loader2, MapPin, Palette, Save, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import {
  ageBands,
  competitionTypes,
  courseInterests,
  getPersonalizedKnowledgeHubPlan,
  getKnowledgeHubTheme,
  getPreferenceCategory,
  knowledgeLearningModes,
  languagePreferences,
  fontPreferences,
  appearanceModes,
  learningGoals,
  learningStyles,
  loadKnowledgeHubPreferences,
  mergeKnowledgeHubPreferences,
  notificationPreferences,
  preferenceCategories,
  saveKnowledgeHubPreferences,
  trainingCategories,
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
  const plan = useMemo(() => getPersonalizedKnowledgeHubPlan(preferences), [preferences]);
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
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function updateCategory(value: PreferenceCategoryKey) {
    const category = getPreferenceCategory(value);
    setStatus("idle");
    setPreferences((current) => ({ ...current, fanCategory: value, favorite: category.options[0] }));
  }

  async function handleSave() {
    setStatus("saving");
    try {
      if (token) {
        await profileApi.updateProfile(token, {
          ageBand: preferences.ageBand,
          institution: preferences.organisation,
          trainingCategory: preferences.trainingCategory,
          preferredMode: preferences.learningMode,
          learningGoal: preferences.learningGoal,
          fanCategory: preferences.fanCategory,
          favorite: preferences.favorite,
          learningStyle: preferences.learningStyle,
          competitionType: preferences.competitionType,
          courseInterest: preferences.courseInterest,
          notificationPreference: preferences.notificationPreference,
          languagePreference: preferences.languagePreference,
          fontPreference: preferences.fontPreference,
          appearanceMode: preferences.appearanceMode,
        });
        await refreshUser();
      }
      saveKnowledgeHubPreferences(preferences);
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
          <h1>{t("personalize.title")}</h1>
          <p>{t("personalize.description")}</p>
        </div>
        <div className="personalize-current">
          <b className="personalize-emblem">{theme.emblem}</b>
          <span>{selectedCategory.label}</span>
          <strong>{preferences.favorite}</strong>
        </div>
      </header>

      {/* Nudge towards onboarding for users who haven't set up their profile */}
      <div className="personalize-onboarding-nudge">
        <MapPin size={16} />
        <span>
          First time here? Complete the{" "}
          <Link to="/onboarding">
            <Sparkles size={13} /> Onboarding wizard
          </Link>{" "}
          to set up your learner profile step by step.
        </span>
      </div>

      <section className="knowledge-grid">
        <article className="knowledge-panel">
          <SectionHeading eyebrow={t("nav.knowledge")} title="Fine-tune your preferences" compact />

          <div className="knowledge-form-grid" style={{ marginTop: 16 }}>
            <label>{t("personalize.age")}<select value={preferences.ageBand} onChange={(e) => updatePreference("ageBand", e.target.value)}>{ageBands.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.organisation")}<input value={preferences.organisation} onChange={(e) => updatePreference("organisation", e.target.value)} placeholder="School, academy, or company" /></label>
            <label>{t("personalize.category")}<select value={preferences.trainingCategory} onChange={(e) => updatePreference("trainingCategory", e.target.value)}>{trainingCategories.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.mode")}<select value={preferences.learningMode} onChange={(e) => updatePreference("learningMode", e.target.value as KnowledgeHubPreferences["learningMode"])}>{knowledgeLearningModes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
            <label>{t("personalize.goal")}<select value={preferences.learningGoal} onChange={(e) => updatePreference("learningGoal", e.target.value)}>{learningGoals.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.interest")}<select value={preferences.fanCategory} onChange={(e) => updateCategory(e.target.value as PreferenceCategoryKey)}>{preferenceCategories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></label>
            <label>{t("personalize.favorite")}<select value={preferences.favorite} onChange={(e) => updatePreference("favorite", e.target.value)}>{selectedCategory.options.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.style")}<select value={preferences.learningStyle} onChange={(e) => updatePreference("learningStyle", e.target.value)}>{learningStyles.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.challenge")}<select value={preferences.competitionType} onChange={(e) => updatePreference("competitionType", e.target.value)}>{competitionTypes.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.course")}<select value={preferences.courseInterest} onChange={(e) => updatePreference("courseInterest", e.target.value)}>{courseInterests.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.notifications")}<select value={preferences.notificationPreference} onChange={(e) => updatePreference("notificationPreference", e.target.value)}>{notificationPreferences.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.language")}<select value={preferences.languagePreference} onChange={(e) => updatePreference("languagePreference", e.target.value)}>{languagePreferences.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.font")}<select value={preferences.fontPreference} onChange={(e) => updatePreference("fontPreference", e.target.value)}>{fontPreferences.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label>{t("personalize.appearance")}<select value={preferences.appearanceMode} onChange={(e) => updatePreference("appearanceMode", e.target.value as KnowledgeHubPreferences["appearanceMode"])}>{appearanceModes.map((o) => <option key={o}>{o}</option>)}</select></label>
          </div>

          <div className="personalize-save-row">
            <button className="primary-button knowledge-save-button" disabled={status === "saving"} onClick={() => void handleSave()} type="button">
              {status === "saving" ? <Loader2 className="spin" size={18} /> : status === "saved" ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {status === "saving" ? `${t("personalize.saving")}...` : status === "saved" ? t("personalize.saved") : t("personalize.save")}
            </button>
            {status === "error" ? <span className="form-error">Could not save your preferences. Please try again.</span> : null}
          </div>
        </article>

        <aside className="knowledge-panel knowledge-preview-panel">
          <SectionHeading eyebrow={t("personalize.preview")} title={plan.themeName} compact />
          <div className="personalize-theme-preview">
            <span className="personalize-theme-emblem">{theme.emblem}</span>
            <div>
              <strong>{theme.name}</strong>
              <small>Your app palette</small>
              <div className="personalize-swatches" aria-label="Selected theme colours">
                {[theme.primary, theme.secondary, theme.accent, theme.highlight].map((colour) => <i key={colour} style={{ background: colour }} />)}
              </div>
            </div>
          </div>
          <div className="knowledge-theme-card"><div className="knowledge-theme-orb"><Palette size={24} /></div><div><span>Achievement style</span><strong>{plan.badge}</strong></div></div>
          <div className="knowledge-theme-card"><div className="knowledge-theme-orb alt"><Trophy size={24} /></div><div><span>Suggested challenge</span><strong>{plan.challenge}</strong></div></div>
          <div className="knowledge-alert-card"><Bell size={18} /><p>{plan.alert}</p></div>
          <div className="personalize-summary">
            <span>Pathway</span><strong>{preferences.trainingCategory}</strong>
            <span>Mode</span><strong>{knowledgeLearningModes.find((item) => item.value === preferences.learningMode)?.label}</strong>
            <span>Goal</span><strong>{preferences.learningGoal}</strong>
          </div>
        </aside>
      </section>
    </section>
  );
}
