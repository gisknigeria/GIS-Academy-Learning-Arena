import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";
import {
  ageBands,
  competitionTypes,
  courseInterests,
  defaultKnowledgeHubPreferences,
  getPreferenceCategory,
  languagePreferences,
  learningGoals,
  learningStyles,
  notificationPreferences,
  preferenceCategories,
  saveKnowledgeHubPreferences,
  type KnowledgeHubPreferences,
  type PreferenceCategoryKey,
} from "../data/knowledgeHub";

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [preferences, setPreferences] = useState<KnowledgeHubPreferences>(defaultKnowledgeHubPreferences);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCategory = getPreferenceCategory(preferences.fanCategory);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      saveKnowledgeHubPreferences(preferences);
      await register({ fullName, email, phone, password, role: "STUDENT" });
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Registration failed. The email or phone may already be in use.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updatePreference<K extends keyof KnowledgeHubPreferences>(key: K, value: KnowledgeHubPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function updateCategory(value: PreferenceCategoryKey) {
    const category = getPreferenceCategory(value);
    setPreferences((current) => ({
      ...current,
      fanCategory: value,
      favorite: category.options[0],
    }));
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <img src={logoMark} alt="" />
        <span className="eyebrow">Free registration</span>
        <h1>Create your Knowledge Hub profile and learn in your world.</h1>
        <p>Choose your interests, learning style, course pathway, competition type, and notification preference.</p>
      </section>

      <section className="auth-panel">
        <div>
          <span className="eyebrow">Join Knowledge Hub</span>
          <h2>Create account</h2>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required />
          </label>
          <div className="auth-form-section">
            <span className="eyebrow">Personalise Knowledge Hub</span>
            <p>Choose what excites you so missions, alerts, badges, challenges, and recommendations feel closer to your world.</p>
          </div>
          <div className="auth-preference-grid">
            <label>
              Age band
              <select value={preferences.ageBand} onChange={(event) => updatePreference("ageBand", event.target.value)}>
                {ageBands.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              School or organisation
              <input
                value={preferences.organisation}
                onChange={(event) => updatePreference("organisation", event.target.value)}
                placeholder="School / company"
              />
            </label>
            <label>
              Learning goal
              <select value={preferences.learningGoal} onChange={(event) => updatePreference("learningGoal", event.target.value)}>
                {learningGoals.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Fan category
              <select value={preferences.fanCategory} onChange={(event) => updateCategory(event.target.value as PreferenceCategoryKey)}>
                {preferenceCategories.map((category) => (
                  <option key={category.key} value={category.key}>{category.label}</option>
                ))}
              </select>
            </label>
            <label>
              Favourite
              <select value={preferences.favorite} onChange={(event) => updatePreference("favorite", event.target.value)}>
                {selectedCategory.options.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Learning style
              <select value={preferences.learningStyle} onChange={(event) => updatePreference("learningStyle", event.target.value)}>
                {learningStyles.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Competition type
              <select value={preferences.competitionType} onChange={(event) => updatePreference("competitionType", event.target.value)}>
                {competitionTypes.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Course interest
              <select value={preferences.courseInterest} onChange={(event) => updatePreference("courseInterest", event.target.value)}>
                {courseInterests.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Notifications
              <select value={preferences.notificationPreference} onChange={(event) => updatePreference("notificationPreference", event.target.value)}>
                {notificationPreferences.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Language
              <select value={preferences.languagePreference} onChange={(event) => updatePreference("languagePreference", event.target.value)}>
                {languagePreferences.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
