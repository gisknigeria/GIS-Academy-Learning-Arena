import { Bell, CheckCircle2, Loader2, Palette, Save, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import {
  ageBands,
  competitionTypes,
  courseInterests,
  getPersonalizedKnowledgeHubPlan,
  getPreferenceCategory,
  knowledgeLearningModes,
  languagePreferences,
  learningGoals,
  learningStyles,
  loadKnowledgeHubPreferences,
  notificationPreferences,
  preferenceCategories,
  saveKnowledgeHubPreferences,
  trainingCategories,
  type KnowledgeHubPreferences,
  type PreferenceCategoryKey,
} from "../data/knowledgeHub";
import { profileApi } from "../lib/profile-api";

function mergeProfile(preferences: KnowledgeHubPreferences, profile: Awaited<ReturnType<typeof profileApi.getMe>>["profile"]) {
  if (!profile) return preferences;
  const fanCategory = preferenceCategories.some((item) => item.key === profile.fanCategory)
    ? profile.fanCategory as PreferenceCategoryKey
    : preferences.fanCategory;
  const category = getPreferenceCategory(fanCategory);

  return {
    ...preferences,
    ageBand: profile.ageBand || preferences.ageBand,
    organisation: profile.institution || preferences.organisation,
    trainingCategory: profile.trainingCategory || preferences.trainingCategory,
    learningMode: (profile.preferredMode as KnowledgeHubPreferences["learningMode"]) || preferences.learningMode,
    learningGoal: profile.learningGoal || preferences.learningGoal,
    fanCategory,
    favorite: category.options.includes(profile.favorite || "") ? profile.favorite! : category.options[0],
    learningStyle: profile.learningStyle || preferences.learningStyle,
    competitionType: profile.competitionType || preferences.competitionType,
    courseInterest: profile.courseInterest || preferences.courseInterest,
    notificationPreference: profile.notificationPreference || preferences.notificationPreference,
    languagePreference: profile.languagePreference || preferences.languagePreference,
  };
}

export function KnowledgeHubPage() {
  const { token, refreshUser } = useAuth();
  const [preferences, setPreferences] = useState<KnowledgeHubPreferences>(() => loadKnowledgeHubPreferences());
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const selectedCategory = getPreferenceCategory(preferences.fanCategory);
  const plan = useMemo(() => getPersonalizedKnowledgeHubPlan(preferences), [preferences]);

  useEffect(() => {
    if (!token) return;
    void profileApi.getMe(token).then((user) => {
      const next = mergeProfile(loadKnowledgeHubPreferences(), user.profile);
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
          <span className="eyebrow">Personalize</span>
          <h1>Make learning fit you</h1>
          <p>Set your learning pathway, interests, pace, and notifications. These choices shape what the platform shows you.</p>
        </div>
        <div className="personalize-current">
          <Sparkles size={20} />
          <span>{selectedCategory.label}</span>
          <strong>{preferences.favorite}</strong>
        </div>
      </header>

      <section className="knowledge-grid">
        <article className="knowledge-panel">
          <SectionHeading eyebrow="Your preferences" title="Learning setup" compact />
          <div className="knowledge-form-grid">
            <label>Age band<select value={preferences.ageBand} onChange={(event) => updatePreference("ageBand", event.target.value)}>{ageBands.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>School or organisation<input value={preferences.organisation} onChange={(event) => updatePreference("organisation", event.target.value)} placeholder="School, academy, or company" /></label>
            <label>Training category<select value={preferences.trainingCategory} onChange={(event) => updatePreference("trainingCategory", event.target.value)}>{trainingCategories.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Learning mode<select value={preferences.learningMode} onChange={(event) => updatePreference("learningMode", event.target.value as KnowledgeHubPreferences["learningMode"])}>{knowledgeLearningModes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>Learning goal<select value={preferences.learningGoal} onChange={(event) => updatePreference("learningGoal", event.target.value)}>{learningGoals.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Interest category<select value={preferences.fanCategory} onChange={(event) => updateCategory(event.target.value as PreferenceCategoryKey)}>{preferenceCategories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}</select></label>
            <label>Favourite interest<select value={preferences.favorite} onChange={(event) => updatePreference("favorite", event.target.value)}>{selectedCategory.options.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Learning style<select value={preferences.learningStyle} onChange={(event) => updatePreference("learningStyle", event.target.value)}>{learningStyles.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Challenge preference<select value={preferences.competitionType} onChange={(event) => updatePreference("competitionType", event.target.value)}>{competitionTypes.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Course interest<select value={preferences.courseInterest} onChange={(event) => updatePreference("courseInterest", event.target.value)}>{courseInterests.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Notifications<select value={preferences.notificationPreference} onChange={(event) => updatePreference("notificationPreference", event.target.value)}>{notificationPreferences.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Language<select value={preferences.languagePreference} onChange={(event) => updatePreference("languagePreference", event.target.value)}>{languagePreferences.map((option) => <option key={option}>{option}</option>)}</select></label>
          </div>
          <div className="personalize-save-row">
            <button className="primary-button knowledge-save-button" disabled={status === "saving"} onClick={() => void handleSave()} type="button">
              {status === "saving" ? <Loader2 className="spin" size={18} /> : status === "saved" ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {status === "saving" ? "Saving..." : status === "saved" ? "Preferences applied" : "Save preferences"}
            </button>
            {status === "error" ? <span className="form-error">Could not save your preferences. Please try again.</span> : null}
          </div>
        </article>

        <aside className="knowledge-panel knowledge-preview-panel">
          <SectionHeading eyebrow="Live preview" title={plan.themeName} compact />
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
