import { CheckCircle2, Loader2, MapPin, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import {
  ageBands, appearanceModes, competitionTypes, courseInterests,
  fontPreferences, getKnowledgeHubTheme, getPersonalizedKnowledgeHubPlan,
  getPreferenceCategory, knowledgeLearningModes, languagePreferences,
  learningGoals, learningStyles, loadKnowledgeHubPreferences,
  mergeKnowledgeHubPreferences, notificationPreferences, preferenceCategories,
  saveKnowledgeHubPreferences, trainingCategories,
  type KnowledgeHubPreferences, type PreferenceCategoryKey,
} from "../data/knowledgeHub";
import { profileApi } from "../lib/profile-api";

/** localStorage key that marks onboarding as completed */
const ONBOARDING_DONE_KEY = "onboarding_completed";

const STEPS = [
  { key: "basics",     label: "Your profile",     emoji: "👤" },
  { key: "learning",   label: "Learning style",   emoji: "🎯" },
  { key: "interests",  label: "Fan interests",    emoji: "⭐" },
  { key: "appearance", label: "Look & feel",      emoji: "🎨" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

export function OnboardingPage() {
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState<KnowledgeHubPreferences>(
    () => loadKnowledgeHubPreferences(),
  );
  const [step, setStep] = useState<StepKey>("basics");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const selectedCategory = getPreferenceCategory(preferences.fanCategory);
  const theme = useMemo(() => getKnowledgeHubTheme(preferences), [preferences]);
  const plan  = useMemo(() => getPersonalizedKnowledgeHubPlan(preferences), [preferences]);

  // One-time guard — if already completed, redirect straight to dashboard
  const alreadyDone = typeof window !== "undefined" && localStorage.getItem(ONBOARDING_DONE_KEY) === "true";
  if (alreadyDone) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    if (!token) return;
    void profileApi.getMe(token).then((user) => {
      const next = mergeKnowledgeHubPreferences(loadKnowledgeHubPreferences(), user.profile);
      setPreferences(next);
      saveKnowledgeHubPreferences(next);
    }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function update<K extends keyof KnowledgeHubPreferences>(key: K, value: KnowledgeHubPreferences[K]) {
    setStatus("idle");
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  function updateCategory(value: PreferenceCategoryKey) {
    const cat = getPreferenceCategory(value);
    setStatus("idle");
    setPreferences((prev) => ({ ...prev, fanCategory: value, favorite: cat.options[0] }));
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
      localStorage.setItem(ONBOARDING_DONE_KEY, "true");
      setStatus("saved");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1400);
    } catch {
      setStatus("error");
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <main className="onboarding-shell">
      {/* ── Left panel: progress + theme preview ── */}
      <aside className="onboarding-aside">
        <div className="onboarding-aside__brand">
          <MapPin size={22} />
          <strong>Getting started</strong>
        </div>
        <nav className="onboarding-nav" aria-label="Onboarding steps">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={[
                "onboarding-nav__item",
                s.key === step ? "is-active" : "",
                i < stepIndex   ? "is-done"   : "",
              ].filter(Boolean).join(" ")}
              onClick={() => setStep(s.key)}
            >
              <span className="onboarding-nav__dot">
                {i < stepIndex ? <CheckCircle2 size={14} /> : i + 1}
              </span>
              <span className="onboarding-nav__emoji">{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Live theme preview */}
        <div className="onboarding-aside__theme">
          <div className="onboarding-aside__orb" style={{ background: theme.primary }}>
            <span style={{ color: theme.highlight }}>{theme.emblem}</span>
          </div>
          <div>
            <strong>{plan.themeName}</strong>
            <small>{preferences.trainingCategory} · {preferences.learningStyle}</small>
            <div className="onboarding-swatches">
              {[theme.primary, theme.secondary, theme.accent, theme.highlight].map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right panel: step content ── */}
      <section className="onboarding-content">
        <div className="onboarding-content__inner">

          {/* STEP 1 — basics */}
          {step === "basics" && (
            <div className="onboarding-card">
              <SectionHeading eyebrow="Step 1 of 4" title="Your learner profile" compact />
              <p className="onboarding-card__desc">
                Tell us a bit about yourself so your first experience feels relevant from day one.
              </p>
              <div className="onboarding-form-grid">
                <label>Age band
                  <select value={preferences.ageBand} onChange={(e) => update("ageBand", e.target.value)}>
                    {ageBands.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>School or organisation
                  <input value={preferences.organisation} onChange={(e) => update("organisation", e.target.value)} placeholder="School, academy, or company" />
                </label>
                <label>Training category
                  <select value={preferences.trainingCategory} onChange={(e) => update("trainingCategory", e.target.value)}>
                    {trainingCategories.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>Learning mode
                  <select value={preferences.learningMode} onChange={(e) => update("learningMode", e.target.value as KnowledgeHubPreferences["learningMode"])}>
                    {knowledgeLearningModes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label>Learning goal
                  <select value={preferences.learningGoal} onChange={(e) => update("learningGoal", e.target.value)}>
                    {learningGoals.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>
              <div className="onboarding-step-nav">
                <button type="button" className="primary-button" onClick={() => setStep("learning")}>
                  Next: Learning style →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — learning style, competition type, course interest */}
          {step === "learning" && (
            <div className="onboarding-card">
              <SectionHeading eyebrow="Step 2 of 4" title="How you like to learn" compact />
              <p className="onboarding-card__desc">
                Choose the mode that matches how you work best, the kind of challenge you enjoy, and the subject area you want to focus on.
              </p>

              <div className="onboarding-pill-section">
                <strong>Learning style</strong>
                <p>Pick the mode that fits how you like to engage with content.</p>
                <div className="onboarding-pill-grid">
                  {learningStyles.map((s) => (
                    <button
                      key={s} type="button"
                      className={"onboarding-pill" + (preferences.learningStyle === s ? " is-selected" : "")}
                      onClick={() => update("learningStyle", s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="onboarding-pill-section">
                <strong>Challenge preference</strong>
                <p>What kind of competition or challenge excites you?</p>
                <div className="onboarding-pill-grid">
                  {competitionTypes.map((c) => (
                    <button
                      key={c} type="button"
                      className={"onboarding-pill" + (preferences.competitionType === c ? " is-selected" : "")}
                      onClick={() => update("competitionType", c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="onboarding-pill-section">
                <strong>Course interest</strong>
                <p>Which subject area do you want to explore most?</p>
                <div className="onboarding-pill-grid">
                  {courseInterests.map((c) => (
                    <button
                      key={c} type="button"
                      className={"onboarding-pill" + (preferences.courseInterest === c ? " is-selected" : "")}
                      onClick={() => update("courseInterest", c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="onboarding-step-nav">
                <button type="button" className="secondary-button" onClick={() => setStep("basics")}>← Back</button>
                <button type="button" className="primary-button" onClick={() => setStep("interests")}>Next: Fan interests →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — fan interests */}
          {step === "interests" && (
            <div className="onboarding-card">
              <SectionHeading eyebrow="Step 3 of 4" title="What excites you" compact />
              <p className="onboarding-card__desc">
                We use this to theme your badges, missions, alerts, and recommendations around what you already love.
              </p>
              <div className="onboarding-form-grid">
                <label>Interest category
                  <select value={preferences.fanCategory} onChange={(e) => updateCategory(e.target.value as PreferenceCategoryKey)}>
                    {preferenceCategories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </label>
                <label>Favourite
                  <select value={preferences.favorite} onChange={(e) => update("favorite", e.target.value)}>
                    {selectedCategory.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>Notification preference
                  <select value={preferences.notificationPreference} onChange={(e) => update("notificationPreference", e.target.value)}>
                    {notificationPreferences.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>Preferred language
                  <select value={preferences.languagePreference} onChange={(e) => update("languagePreference", e.target.value)}>
                    {languagePreferences.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>

              {/* Theme preview card */}
              <div className="onboarding-theme-preview">
                <div className="onboarding-theme-preview__orb" style={{ background: theme.primary }}>
                  <span style={{ color: theme.highlight }}>{theme.emblem}</span>
                </div>
                <div>
                  <strong>{theme.name}</strong>
                  <small>Your personalised palette</small>
                  <div className="onboarding-swatches">
                    {[theme.primary, theme.secondary, theme.accent, theme.highlight].map((c) => (
                      <i key={c} style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="onboarding-step-nav">
                <button type="button" className="secondary-button" onClick={() => setStep("learning")}>← Back</button>
                <button type="button" className="primary-button" onClick={() => setStep("appearance")}>Next: Look & feel →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — appearance */}
          {step === "appearance" && (
            <div className="onboarding-card">
              <SectionHeading eyebrow="Step 4 of 4" title="Look & feel" compact />
              <p className="onboarding-card__desc">
                Pick the font and colour mode that makes reading and learning most comfortable for you.
              </p>
              <div className="onboarding-form-grid">
                <label>Font
                  <select value={preferences.fontPreference} onChange={(e) => update("fontPreference", e.target.value)}>
                    {fontPreferences.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>Appearance mode
                  <select value={preferences.appearanceMode} onChange={(e) => update("appearanceMode", e.target.value as KnowledgeHubPreferences["appearanceMode"])}>
                    {appearanceModes.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>

              <div className="onboarding-step-nav">
                <button type="button" className="secondary-button" onClick={() => setStep("interests")}>← Back</button>
                <button type="button" className="primary-button" disabled={status === "saving"} onClick={() => void handleSave()}>
                  {status === "saving" ? <Loader2 size={16} className="spin" /> : status === "saved" ? <CheckCircle2 size={16} /> : <Save size={16} />}
                  {status === "saving" ? "Saving…" : status === "saved" ? "All set!" : "Finish setup"}
                </button>
              </div>

              {status === "error" && (
                <p className="form-error">Could not save your preferences. Please try again.</p>
              )}
              {status === "saved" && (
                <div className="onboarding-saved-banner">
                  <CheckCircle2 size={16} />
                  <span>Profile saved — taking you to your dashboard…</span>
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
