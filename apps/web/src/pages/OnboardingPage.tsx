import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Loader2, Save, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import {
  ageBands,
  courseInterests,
  knowledgeLearningModes,
  learningGoals,
  loadKnowledgeHubPreferences,
  mergeKnowledgeHubPreferences,
  saveKnowledgeHubPreferences,
  trainingCategories,
  type KnowledgeHubPreferences,
} from "../data/knowledgeHub";
import { profileApi } from "../lib/profile-api";

type Step = "profile" | "goals";

export function OnboardingPage() {
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<KnowledgeHubPreferences>(() => loadKnowledgeHubPreferences());
  const [step, setStep] = useState<Step>("profile");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    if (!token) return;
    void profileApi.getMe(token).then((user) => {
      const next = mergeKnowledgeHubPreferences(loadKnowledgeHubPreferences(), user.profile);
      setPreferences(next);
      saveKnowledgeHubPreferences(next);
    }).catch(() => undefined);
  }, [token]);

  function update<K extends keyof KnowledgeHubPreferences>(key: K, value: KnowledgeHubPreferences[K]) {
    setStatus("idle");
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  const canContinue = Boolean(preferences.ageBand && preferences.organisation.trim() && preferences.trainingCategory && preferences.learningMode);
  const canFinish = Boolean(preferences.learningGoal && preferences.courseInterest);

  async function finishOnboarding() {
    if (!token || !canFinish) return;
    setStatus("saving");
    try {
      await profileApi.updateProfile(token, {
        ageBand: preferences.ageBand,
        institution: preferences.organisation.trim(),
        trainingCategory: preferences.trainingCategory,
        preferredMode: preferences.learningMode,
        learningGoal: preferences.learningGoal,
        courseInterest: preferences.courseInterest,
        onboardingCompleted: true,
      });
      saveKnowledgeHubPreferences(preferences);
      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="onboarding-shell onboarding-shell--focused">
      <aside className="onboarding-aside">
        <div className="onboarding-aside__brand">
          <GraduationCap size={22} />
          <strong>Set up your learning</strong>
        </div>
        <nav className="onboarding-nav" aria-label="Onboarding steps">
          <button type="button" className={`onboarding-nav__item ${step === "profile" ? "is-active" : "is-done"}`} onClick={() => setStep("profile")}>
            <span className="onboarding-nav__dot">{step === "goals" ? <CheckCircle2 size={14} /> : 1}</span>
            <GraduationCap size={18} />
            <span>Learning profile</span>
          </button>
          <button type="button" className={`onboarding-nav__item ${step === "goals" ? "is-active" : ""}`} onClick={() => canContinue && setStep("goals")}>
            <span className="onboarding-nav__dot">2</span>
            <Target size={18} />
            <span>Goals and interests</span>
          </button>
        </nav>
        <div className="onboarding-aside__note">
          <strong>Why we ask</strong>
          <p>Your answers determine which courses, cohorts, and learning format appear first.</p>
        </div>
      </aside>

      <section className="onboarding-content">
        <div className="onboarding-content__inner">
          {step === "profile" ? (
            <div className="onboarding-card">
              <SectionHeading eyebrow="Step 1 of 2" title="Tell us about your learning setup" compact />
              <p className="onboarding-card__desc">We use this once to show the correct programmes and delivery experience.</p>
              <div className="onboarding-form-grid">
                <label>Age band
                  <select value={preferences.ageBand} onChange={(event) => update("ageBand", event.target.value)}>{ageBands.map((option) => <option key={option}>{option}</option>)}</select>
                </label>
                <label>School or organisation
                  <input required value={preferences.organisation} onChange={(event) => update("organisation", event.target.value)} placeholder="School, academy, or company" />
                </label>
                <label>Training category
                  <select value={preferences.trainingCategory} onChange={(event) => update("trainingCategory", event.target.value)}>{trainingCategories.map((option) => <option key={option}>{option}</option>)}</select>
                </label>
                <label>Learning mode
                  <select value={preferences.learningMode} onChange={(event) => update("learningMode", event.target.value as KnowledgeHubPreferences["learningMode"])}>{knowledgeLearningModes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                </label>
              </div>
              <div className="onboarding-step-nav">
                <button type="button" className="primary-button" disabled={!canContinue} onClick={() => setStep("goals")}>Continue <ArrowRight size={17} /></button>
              </div>
            </div>
          ) : (
            <div className="onboarding-card">
              <SectionHeading eyebrow="Step 2 of 2" title="What would you like to achieve?" compact />
              <p className="onboarding-card__desc">Choose the main outcome and subject area you want the platform to prioritise.</p>
              <div className="onboarding-form-grid">
                <label>Learning goal
                  <select value={preferences.learningGoal} onChange={(event) => update("learningGoal", event.target.value)}>{learningGoals.map((option) => <option key={option}>{option}</option>)}</select>
                </label>
                <label>What would you like to learn?
                  <select value={preferences.courseInterest} onChange={(event) => update("courseInterest", event.target.value)}>{courseInterests.map((option) => <option key={option}>{option}</option>)}</select>
                </label>
              </div>
              <div className="onboarding-review">
                <span>Category<strong>{preferences.trainingCategory}</strong></span>
                <span>Mode<strong>{knowledgeLearningModes.find((item) => item.value === preferences.learningMode)?.label}</strong></span>
                <span>Focus<strong>{preferences.courseInterest}</strong></span>
              </div>
              {status === "error" ? <p className="form-error">We could not save your onboarding. Please try again.</p> : null}
              <div className="onboarding-step-nav">
                <button type="button" className="secondary-button" onClick={() => setStep("profile")}><ArrowLeft size={17} /> Back</button>
                <button type="button" className="primary-button" disabled={!canFinish || status === "saving"} onClick={() => void finishOnboarding()}>
                  {status === "saving" ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                  {status === "saving" ? "Saving..." : "Finish setup"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
