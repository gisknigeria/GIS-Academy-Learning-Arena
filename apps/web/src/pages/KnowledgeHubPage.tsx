import {
  Bell,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Flame,
  Gamepad2,
  GraduationCap,
  Palette,
  Route,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { SectionHeading } from "../components/SectionHeading";
import {
  ageBands,
  competitionTypes,
  courseInterests,
  getPersonalizedKnowledgeHubPlan,
  getPreferenceCategory,
  languagePreferences,
  learningGoals,
  learningStyles,
  loadKnowledgeHubPreferences,
  notificationPreferences,
  platformModules,
  preferenceCategories,
  saveKnowledgeHubPreferences,
  type KnowledgeHubPreferences,
  type PreferenceCategoryKey,
} from "../data/knowledgeHub";

const stickinessFeatures = [
  ["Fan personalisation", "Learners choose clubs, players, games, music, cartoons, news, or career interests."],
  ["Custom themes", "Colours, badges, dashboard style, challenge names, and alerts adapt to each learner."],
  ["Learning missions", "Courses become practical 5-15 minute missions with visible progress."],
  ["Live competitions", "Quizzes, map challenges, coding sprints, innovation contests, and career challenges."],
  ["Leaderboards", "Rankings by cohort, school, state, course, fan group, and competition category."],
  ["Feedback loops", "Trainer comments, corrections, scores, and resubmission guidance keep growth visible."],
];

const guardrails = [
  "Use original badges, abstract icons, fan-inspired colours, and custom avatars unless licensed assets are available.",
  "Keep learning as the main goal while fan identity attracts attention.",
  "Apply age-aware filtering for unsafe games, mature content, gambling, adult content, and harmful challenges.",
  "Allow users to change preferences, reduce notifications, or opt out of personalisation.",
  "Collect only the data needed for learning, engagement, reporting, and certification.",
  "Use healthy motivation and competition, not harmful addictive design.",
];

const sampleAlerts = [
  ["Football", "Matchday Mission is live. Complete today's quiz and climb your club leaderboard."],
  ["Basketball", "Fast Break Challenge: beat your last score and move up the board."],
  ["News", "Today's Current Affairs Brief is ready. Learn from real-world headlines."],
  ["Cartoon", "Hero Mission Unlocked. Solve today's challenge and earn a power badge."],
  ["Games", "New Quest Available. Complete one short lesson and earn XP."],
  ["Music", "Beat Drop Challenge: finish today's module and keep your learning rhythm alive."],
  ["GIS", "Map Mission: explore a real-world location problem and submit your solution."],
  ["Coding", "Code Sprint Open: solve one task and build your developer streak."],
  ["Entrepreneurship", "Startup Builder Alert: complete today's business idea canvas."],
  ["Environment", "Climate Action Challenge: learn, map, and propose a solution."],
];

export function KnowledgeHubPage() {
  const [preferences, setPreferences] = useState<KnowledgeHubPreferences>(() => loadKnowledgeHubPreferences());
  const [saved, setSaved] = useState(false);

  const selectedCategory = getPreferenceCategory(preferences.fanCategory);
  const plan = useMemo(() => getPersonalizedKnowledgeHubPlan(preferences), [preferences]);

  function updatePreference<K extends keyof KnowledgeHubPreferences>(key: K, value: KnowledgeHubPreferences[K]) {
    setSaved(false);
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function updateCategory(value: PreferenceCategoryKey) {
    const category = getPreferenceCategory(value);
    setSaved(false);
    setPreferences((current) => ({
      ...current,
      fanCategory: value,
      favorite: category.options[0],
    }));
  }

  function handleSave() {
    saveKnowledgeHubPreferences(preferences);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  return (
    <section className="knowledge-hub-page">
      <section className="knowledge-hero">
        <div className="knowledge-hero-copy">
          <span className="eyebrow">Knowledge Hub</span>
          <h1>Learn in your world. Compete with purpose. Grow with feedback.</h1>
          <p>
            A personalised learning hub that adapts missions, colours, badges, challenges,
            alerts, leaderboards, certificates, and trainer feedback to what excites each learner.
          </p>
          <div className="knowledge-hero-actions">
            <a className="primary-button" href="#preference-engine">
              <Sparkles size={18} />
              Personalise hub
            </a>
            <a className="secondary-button" href="#platform-modules">
              <BrainCircuit size={18} />
              View modules
            </a>
          </div>
        </div>

        <aside className="knowledge-live-card">
          <div className="knowledge-live-card-top">
            <span>{selectedCategory.label}</span>
            <strong>{preferences.favorite}</strong>
          </div>
          <div className="knowledge-score-orb">
            <strong>{plan.recommendationScore}</strong>
            <span>match score</span>
          </div>
          <p>{plan.alert}</p>
        </aside>
      </section>

      <section id="preference-engine" className="knowledge-grid">
        <article className="knowledge-panel">
          <SectionHeading eyebrow="Preference engine" title="Personalisation setup" />
          <div className="knowledge-form-grid">
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
                placeholder="School, academy, company"
              />
            </label>
            <label>
              Learning goal
              <select value={preferences.learningGoal} onChange={(event) => updatePreference("learningGoal", event.target.value)}>
                {learningGoals.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Preferred fan category
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
          <button className="primary-button knowledge-save-button" onClick={handleSave} type="button">
            {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saved ? "Preferences saved" : "Save preferences"}
          </button>
        </article>

        <aside className="knowledge-panel knowledge-preview-panel">
          <SectionHeading eyebrow="Theme engine" title={plan.themeName} compact />
          <div className="knowledge-theme-card">
            <div className="knowledge-theme-orb">
              <Palette size={28} />
            </div>
            <div>
              <span>Badge style</span>
              <strong>{plan.badge}</strong>
            </div>
          </div>
          <div className="knowledge-theme-card">
            <div className="knowledge-theme-orb alt">
              <Trophy size={28} />
            </div>
            <div>
              <span>Recommended challenge</span>
              <strong>{plan.challenge}</strong>
            </div>
          </div>
          <div className="knowledge-alert-card">
            <Bell size={18} />
            <p>{plan.alert}</p>
          </div>
        </aside>
      </section>

      <section className="knowledge-section">
        <SectionHeading eyebrow="Stickiness framework" title="What keeps learners engaged" />
        <div className="knowledge-feature-grid">
          {stickinessFeatures.map(([title, body], index) => (
            <article className="knowledge-feature-card" key={title}>
              <span>{index + 1}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="knowledge-section">
        <SectionHeading eyebrow="Dropdown library" title="Preference options from the brief" />
        <div className="knowledge-library-grid">
          {preferenceCategories.map((category) => (
            <article className="knowledge-library-card" key={category.key}>
              <strong>{category.label}</strong>
              <div>
                {category.options.map((option) => (
                  <span key={option}>{option}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="knowledge-section knowledge-split">
        <article className="knowledge-panel">
          <SectionHeading eyebrow="Recommendation logic" title="Simple scoring model" />
          <div className="knowledge-score-formula">
            Preference Match + Learning Goal Match + Course Level Fit + Cohort Activity + Recent Engagement + Completion Probability + Diversity Bonus - Fatigue Penalty
          </div>
          <div className="knowledge-score-list">
            {plan.recommendationParts.map((part) => (
              <span key={part}>{part}</span>
            ))}
          </div>
        </article>

        <article className="knowledge-panel">
          <SectionHeading eyebrow="Career pathways" title="Skills linked to opportunity" />
          <div className="knowledge-pathway-list">
            {courseInterests.slice(0, 8).map((interest) => (
              <div key={interest}>
                <Route size={16} />
                <span>{interest}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="knowledge-section">
        <SectionHeading eyebrow="Smart notifications" title="Sample alerts and engagement snippets" />
        <div className="knowledge-alert-grid">
          {sampleAlerts.map(([category, alert]) => (
            <article className="knowledge-sample-alert" key={category}>
              <span>{category}</span>
              <p>{alert}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="platform-modules" className="knowledge-section">
        <SectionHeading eyebrow="Programmer-ready modules" title="Platform modules from the brief" />
        <div className="knowledge-module-grid">
          {platformModules.map(([module, body]) => (
            <article className="knowledge-module-card" key={module}>
              <ShieldCheck size={18} />
              <strong>{module}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="knowledge-section knowledge-split">
        <article className="knowledge-panel">
          <SectionHeading eyebrow="Learning engine" title="Mission experience" />
          <div className="knowledge-mission-stack">
            <div><BookOpenCheck size={18} /><span>5-15 minute practical missions</span></div>
            <div><Gamepad2 size={18} /><span>XP, levels, quests, unlocks, and progress maps</span></div>
            <div><Flame size={18} /><span>Daily goals, weekly streaks, milestones, and certificates</span></div>
            <div><GraduationCap size={18} /><span>Trainer feedback, corrections, and resubmission guidance</span></div>
          </div>
        </article>

        <article className="knowledge-panel">
          <SectionHeading eyebrow="Guardrails" title="Safe implementation rules" />
          <ul className="knowledge-guardrail-list">
            {guardrails.map((rule) => (
              <li key={rule}>
                <CheckCircle2 size={15} />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="knowledge-launch-panel">
        <span className="eyebrow">Launch narrative</span>
        <h2>Build Skills. Prove Talent. Unlock Opportunity.</h2>
        <p>
          Knowledge Hub is a personalised learning platform where learners enter through
          what excites them, stay because progress is visible, compete because achievement
          is rewarding, and grow because trainer feedback is continuous.
        </p>
      </section>
    </section>
  );
}
