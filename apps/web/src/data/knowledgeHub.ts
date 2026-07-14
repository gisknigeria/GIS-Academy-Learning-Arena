export type PreferenceCategoryKey =
  | "football-clubs"
  | "football-players"
  | "basketball-teams"
  | "basketball-players"
  | "local-news"
  | "international-news"
  | "cartoons"
  | "games"
  | "music"
  | "career";

export type KnowledgeHubPreferences = {
  ageBand: string;
  organisation: string;
  trainingCategory: string;
  learningMode: "E_LEARNING" | "ONSITE" | "HYBRID";
  learningGoal: string;
  fanCategory: PreferenceCategoryKey;
  favorite: string;
  learningStyle: string;
  competitionType: string;
  courseInterest: string;
  notificationPreference: string;
  languagePreference: string;
  fontPreference: string;
  appearanceMode: "Light" | "Dark" | "System";
};

export type PreferenceCategory = {
  key: PreferenceCategoryKey;
  label: string;
  options: string[];
};

export type KnowledgeHubTheme = {
  name: string;
  emblem: string;
  primary: string;
  secondary: string;
  accent: string;
  highlight: string;
  surface: string;
  onPrimary: string;
  onHighlight: string;
};

export const KNOWLEDGE_HUB_STORAGE_KEY = "knowledge_hub_preferences";

export const preferenceCategories: PreferenceCategory[] = [
  {
    key: "football-clubs",
    label: "Football Clubs",
    options: ["Arsenal", "Real Madrid", "Barcelona", "Manchester City", "Manchester United", "Liverpool", "Chelsea", "Bayern Munich", "Paris Saint-Germain", "Inter Milan"],
  },
  {
    key: "football-players",
    label: "Football Players",
    options: ["Cristiano Ronaldo", "Lionel Messi", "Kylian Mbappe", "Erling Haaland", "Vinicius Junior", "Jude Bellingham", "Mohamed Salah", "Bukayo Saka", "Lamine Yamal", "Harry Kane"],
  },
  {
    key: "basketball-teams",
    label: "Basketball Teams",
    options: ["Golden State Warriors", "Los Angeles Lakers", "New York Knicks", "Boston Celtics", "Chicago Bulls", "Miami Heat", "Houston Rockets", "San Antonio Spurs", "Dallas Mavericks", "Philadelphia 76ers"],
  },
  {
    key: "basketball-players",
    label: "Basketball Players",
    options: ["Stephen Curry", "LeBron James", "Luka Doncic", "Victor Wembanyama", "Nikola Jokic", "Giannis Antetokounmpo", "Anthony Edwards", "Jayson Tatum", "Shai Gilgeous-Alexander", "Jalen Brunson"],
  },
  {
    key: "local-news",
    label: "Local News / Nigerian Media",
    options: ["BCOS", "NTA", "Channels TV", "TVC News", "Arise News", "AIT", "The Punch", "The Guardian Nigeria", "Premium Times", "BBC News Pidgin"],
  },
  {
    key: "international-news",
    label: "International News",
    options: ["CNN", "BBC", "Al Jazeera", "Reuters", "Associated Press", "DW", "France 24", "Bloomberg", "CNBC", "Sky News"],
  },
  {
    key: "cartoons",
    label: "Cartoon / Animation",
    options: ["Spider-Man", "Naruto", "Goku", "Pikachu", "SpongeBob", "Aang", "Ben 10", "Doraemon", "Bluey", "Moana"],
  },
  {
    key: "games",
    label: "Games / eSports",
    options: ["Minecraft", "Roblox", "Fortnite", "EA Sports FC", "Rocket League", "Mario Kart", "Subway Surfers", "Pokemon GO", "Chess.com", "Candy Crush"],
  },
  {
    key: "music",
    label: "Music / Entertainment",
    options: ["Afrobeats", "Gospel", "Hip-Hop", "Amapiano", "Pop", "R&B", "K-Pop", "Reggae", "Classical", "Dance/Electronic"],
  },
  {
    key: "career",
    label: "Career / Industry Interests",
    options: ["GIS and Mapping", "Artificial Intelligence", "Software Development", "Cybersecurity", "Agriculture Technology", "Climate and Environment", "Creative Media", "Business and Entrepreneurship", "Robotics", "Health Technology"],
  },
];

export const ageBands = ["Under 13", "13-15", "16-18", "19-24", "25-34", "35+"];
export const trainingCategories = [
  "Academy",
  "Corporate",
  "Geography Green",
];
export const knowledgeLearningModes = [
  { value: "E_LEARNING", label: "E-Learning" },
  { value: "ONSITE", label: "Onsite" },
  { value: "HYBRID", label: "Hybrid" },
] as const;
export const learningGoals = ["Build job-ready skills", "Prepare for competition", "Earn certificates", "Improve school performance", "Build a portfolio", "Explore career pathways"];
export const learningStyles = ["Challenge Mode", "Coach Mode", "Story Mode", "Team Mode", "Solo Sprint", "Bootcamp Mode", "Competition Mode", "Certificate Track", "Mentorship Track", "Project Portfolio Track"];
export const competitionTypes = ["Live quiz", "Map challenge", "Coding sprint", "Innovation contest", "Career challenge", "Team tournament", "Solo timed challenge"];
export const courseInterests = ["GIS and Mapping", "Artificial Intelligence", "Cybersecurity", "Agriculture Technology", "Fintech", "Media", "Climate", "Entrepreneurship", "Software Development"];
export const notificationPreferences = ["Daily motivation", "Competition alerts", "Trainer feedback", "Weekly digest", "Certificates and badges", "Minimal notifications"];
export const languagePreferences = ["English", "Pidgin", "Yoruba", "Hausa", "Igbo", "French"];
export const fontPreferences = ["Inter", "Poppins", "Nunito", "Atkinson Hyperlegible", "Merriweather"];
export const appearanceModes = ["Light", "Dark", "System"] as const;

export const platformModules = [
  ["User Profile", "Stores learner data, school, cohort, age band, goals, and status"],
  ["Preference Engine", "Manages selected interests, fan categories, and dropdown options"],
  ["Theme Engine", "Applies colours, symbols, badges, dashboards, and learning tone"],
  ["Content Tagging System", "Tags courses by skill, level, theme, career path, and category"],
  ["Recommendation Engine", "Suggests courses, challenges, certificates, and competitions"],
  ["Gamification Engine", "Manages points, badges, streaks, missions, ranks, and certificates"],
  ["Competition Engine", "Runs live quizzes, leaderboards, timed challenges, and contests"],
  ["Feedback Engine", "Manages trainer comments, rubrics, scores, and resubmissions"],
  ["Notification Engine", "Sends personalised reminders, alerts, snippets, and progress updates"],
  ["Analytics Dashboard", "Tracks engagement, completion, retention, certificates, and drop-off"],
] as const;

export const defaultKnowledgeHubPreferences: KnowledgeHubPreferences = {
  ageBand: "16-18",
  organisation: "",
  trainingCategory: "Academy",
  learningMode: "E_LEARNING",
  learningGoal: "Build job-ready skills",
  fanCategory: "football-clubs",
  favorite: "Arsenal",
  learningStyle: "Competition Mode",
  competitionType: "Map challenge",
  courseInterest: "GIS and Mapping",
  notificationPreference: "Daily motivation",
  languagePreference: "English",
  fontPreference: "Inter",
  appearanceMode: "Light",
};

export function getPreferenceCategory(key: PreferenceCategoryKey) {
  return preferenceCategories.find((category) => category.key === key) ?? preferenceCategories[0];
}

export function loadKnowledgeHubPreferences(): KnowledgeHubPreferences {
  if (typeof window === "undefined") return defaultKnowledgeHubPreferences;
  try {
    const raw = localStorage.getItem(KNOWLEDGE_HUB_STORAGE_KEY);
    if (!raw) return defaultKnowledgeHubPreferences;
    return { ...defaultKnowledgeHubPreferences, ...(JSON.parse(raw) as Partial<KnowledgeHubPreferences>) };
  } catch {
    return defaultKnowledgeHubPreferences;
  }
}

export function mergeKnowledgeHubPreferences(
  preferences: KnowledgeHubPreferences,
  profile?: Partial<{
    ageBand: string | null;
    institution: string | null;
    trainingCategory: string | null;
    preferredMode: string | null;
    learningGoal: string | null;
    fanCategory: string | null;
    favorite: string | null;
    learningStyle: string | null;
    competitionType: string | null;
    courseInterest: string | null;
    notificationPreference: string | null;
    languagePreference: string | null;
    fontPreference: string | null;
    appearanceMode: string | null;
  }> | null,
) {
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
    fontPreference: profile.fontPreference || preferences.fontPreference,
    appearanceMode: (profile.appearanceMode as KnowledgeHubPreferences["appearanceMode"]) || preferences.appearanceMode,
  };
}

export function saveKnowledgeHubPreferences(preferences: KnowledgeHubPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KNOWLEDGE_HUB_STORAGE_KEY, JSON.stringify(preferences));
  applyKnowledgeHubPreferences(preferences);
  window.dispatchEvent(new CustomEvent("knowledge-hub:preferences-updated", { detail: preferences }));
}

const categoryThemes: Record<PreferenceCategoryKey, KnowledgeHubTheme> = {
  "football-clubs": { name: "Matchday", emblem: "FC", primary: "#102a22", secondary: "#176b4d", accent: "#d4a72c", highlight: "#d8ff78", surface: "#f2f8f5", onPrimary: "#ffffff", onHighlight: "#102a22" },
  "football-players": { name: "Player Focus", emblem: "XI", primary: "#172554", secondary: "#2563eb", accent: "#f59e0b", highlight: "#facc15", surface: "#f4f7ff", onPrimary: "#ffffff", onHighlight: "#172554" },
  "basketball-teams": { name: "Courtside", emblem: "BB", primary: "#35140c", secondary: "#c2410c", accent: "#f59e0b", highlight: "#fdba74", surface: "#fff7ed", onPrimary: "#ffffff", onHighlight: "#35140c" },
  "basketball-players": { name: "All-Star", emblem: "AS", primary: "#23113f", secondary: "#7e22ce", accent: "#f59e0b", highlight: "#facc15", surface: "#faf5ff", onPrimary: "#ffffff", onHighlight: "#23113f" },
  "local-news": { name: "Nigeria Brief", emblem: "NG", primary: "#0b3023", secondary: "#087f5b", accent: "#d4a72c", highlight: "#a7f3d0", surface: "#f2faf6", onPrimary: "#ffffff", onHighlight: "#0b3023" },
  "international-news": { name: "World Desk", emblem: "24", primary: "#10233f", secondary: "#1d4ed8", accent: "#dc2626", highlight: "#bfdbfe", surface: "#f3f7fc", onPrimary: "#ffffff", onHighlight: "#10233f" },
  cartoons: { name: "Hero Studio", emblem: "FX", primary: "#35205c", secondary: "#7c3aed", accent: "#f59e0b", highlight: "#fde047", surface: "#faf7ff", onPrimary: "#ffffff", onHighlight: "#35205c" },
  games: { name: "Quest Mode", emblem: "XP", primary: "#082f35", secondary: "#087f8c", accent: "#f97316", highlight: "#a3e635", surface: "#f1faf9", onPrimary: "#ffffff", onHighlight: "#082f35" },
  music: { name: "Learning Studio", emblem: "♪", primary: "#42162c", secondary: "#b52b65", accent: "#0891b2", highlight: "#f9a8d4", surface: "#fff5fa", onPrimary: "#ffffff", onHighlight: "#42162c" },
  career: { name: "Career Lab", emblem: "PRO", primary: "#16352a", secondary: "#246b45", accent: "#b7791f", highlight: "#b7e4c7", surface: "#f3f8f5", onPrimary: "#ffffff", onHighlight: "#16352a" },
};

const favoriteThemes: Record<string, Partial<KnowledgeHubTheme>> = {
  Arsenal: { name: "North London", emblem: "ARS", primary: "#450611", secondary: "#db1623", accent: "#d4a017", highlight: "#f4c542", surface: "#fff5f6", onHighlight: "#2b070d" },
  "Real Madrid": { name: "Madrid Elite", emblem: "RMA", primary: "#172554", secondary: "#5b5fc7", accent: "#d4af37", highlight: "#f7d774", surface: "#fafaff", onHighlight: "#172554" },
  Barcelona: { name: "Catalan Focus", emblem: "FCB", primary: "#18245a", secondary: "#a50044", accent: "#edbb00", highlight: "#f5d142", surface: "#fff7fa", onHighlight: "#18245a" },
  "Manchester City": { name: "Sky Blue", emblem: "MCI", primary: "#173a5e", secondary: "#6cabdd", accent: "#d4a72c", highlight: "#b9e2f5", surface: "#f3faff", onHighlight: "#173a5e" },
  "Manchester United": { name: "Red United", emblem: "MUN", primary: "#4b0710", secondary: "#da291c", accent: "#fbe122", highlight: "#fbe122", surface: "#fff6f3", onHighlight: "#321015" },
  Liverpool: { name: "Anfield Red", emblem: "LIV", primary: "#4a0710", secondary: "#c8102e", accent: "#00b2a9", highlight: "#72e0d1", surface: "#fff5f6", onHighlight: "#321015" },
  Chelsea: { name: "London Blue", emblem: "CHE", primary: "#071a4a", secondary: "#034694", accent: "#d4a017", highlight: "#8fc9ff", surface: "#f4f8ff", onHighlight: "#071a4a" },
  "Bayern Munich": { name: "Bavarian Red", emblem: "FCB", primary: "#500018", secondary: "#dc052d", accent: "#0066b2", highlight: "#8fd0ff", surface: "#fff5f7", onHighlight: "#30101a" },
  "Paris Saint-Germain": { name: "Paris Night", emblem: "PSG", primary: "#061a3a", secondary: "#004170", accent: "#da291c", highlight: "#f1c75b", surface: "#f4f7fc", onHighlight: "#061a3a" },
  "Inter Milan": { name: "Milano Blue", emblem: "INT", primary: "#050b16", secondary: "#0057b8", accent: "#c89b3c", highlight: "#75baff", surface: "#f2f7fc", onHighlight: "#050b16" },
  "Golden State Warriors": { name: "Bay Gold", emblem: "GSW", primary: "#102a56", secondary: "#1d428a", accent: "#ffc72c", highlight: "#ffc72c", surface: "#f5f8ff", onHighlight: "#102a56" },
  "Los Angeles Lakers": { name: "Lake Show", emblem: "LAL", primary: "#2f1255", secondary: "#552583", accent: "#fdb927", highlight: "#fdb927", surface: "#faf5ff", onHighlight: "#2f1255" },
  "New York Knicks": { name: "New York Court", emblem: "NYK", primary: "#0f2c5c", secondary: "#006bb6", accent: "#f58426", highlight: "#ffb36f", surface: "#f5f9ff", onHighlight: "#0f2c5c" },
  "Boston Celtics": { name: "Celtic Court", emblem: "BOS", primary: "#07351e", secondary: "#007a33", accent: "#ba9653", highlight: "#80d6a8", surface: "#f1faf5", onHighlight: "#07351e" },
  "Chicago Bulls": { name: "Chicago Red", emblem: "CHI", primary: "#3d0610", secondary: "#ce1141", accent: "#111111", highlight: "#ff8ca7", surface: "#fff4f6", onHighlight: "#3d0610" },
  "Miami Heat": { name: "Miami Heat", emblem: "MIA", primary: "#3b0713", secondary: "#98002e", accent: "#f9a01b", highlight: "#ffc66d", surface: "#fff5f7", onHighlight: "#3b0713" },
  "Houston Rockets": { name: "Rocket Red", emblem: "HOU", primary: "#3c080d", secondary: "#ce1141", accent: "#c4ced4", highlight: "#ff8ca7", surface: "#fff5f6", onHighlight: "#3c080d" },
  "San Antonio Spurs": { name: "Silver Court", emblem: "SAS", primary: "#171717", secondary: "#4b5563", accent: "#c4ced4", highlight: "#d9e0e5", surface: "#f6f7f8", onHighlight: "#171717" },
  "Dallas Mavericks": { name: "Dallas Blue", emblem: "DAL", primary: "#102543", secondary: "#00538c", accent: "#b8c4ca", highlight: "#8ac7ed", surface: "#f3f8fc", onHighlight: "#102543" },
  "Philadelphia 76ers": { name: "Philly Court", emblem: "PHI", primary: "#0b2d55", secondary: "#006bb6", accent: "#ed174c", highlight: "#8acdf5", surface: "#f4f9ff", onHighlight: "#0b2d55" },
};

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]).join("").toUpperCase();
}

export function getKnowledgeHubTheme(preferences: KnowledgeHubPreferences): KnowledgeHubTheme {
  const base = categoryThemes[preferences.fanCategory];
  const favorite = favoriteThemes[preferences.favorite];
  return {
    ...base,
    emblem: favorite?.emblem || initials(preferences.favorite) || base.emblem,
    ...favorite,
  };
}

export function applyKnowledgeHubPreferences(preferences: KnowledgeHubPreferences) {
  if (typeof document === "undefined") return;
  const theme = getKnowledgeHubTheme(preferences);
  document.documentElement.dataset.learningTheme = preferences.fanCategory;
  document.documentElement.dataset.favoriteTheme = preferences.favorite.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  document.documentElement.dataset.learningStyle = preferences.learningStyle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const root = document.documentElement.style;
  root.setProperty("--personal-accent", theme.secondary);
  root.setProperty("--theme-primary", theme.primary);
  root.setProperty("--theme-secondary", theme.secondary);
  root.setProperty("--theme-accent", theme.accent);
  root.setProperty("--theme-highlight", theme.highlight);
  root.setProperty("--favorite-surface", theme.surface);
  root.setProperty("--theme-on-primary", theme.onPrimary);
  root.setProperty("--theme-on-highlight", theme.onHighlight);
  root.setProperty("--theme-symbol", JSON.stringify(theme.emblem));
  const fontFamilies: Record<string, string> = {
    Inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
    Poppins: '"Poppins", ui-sans-serif, system-ui, sans-serif',
    Nunito: '"Nunito", ui-sans-serif, system-ui, sans-serif',
    "Atkinson Hyperlegible": '"Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif',
    Merriweather: '"Merriweather", Georgia, serif',
  };
  root.setProperty("--app-font", fontFamilies[preferences.fontPreference] || fontFamilies.Inter);
  document.documentElement.dataset.appearance = preferences.appearanceMode.toLowerCase();
  const languageCodes: Record<string, string> = { English: "en", Pidgin: "pcm", Yoruba: "yo", Hausa: "ha", Igbo: "ig", French: "fr" };
  document.documentElement.lang = languageCodes[preferences.languagePreference] || "en";
}

export function getPersonalizedKnowledgeHubPlan(preferences: KnowledgeHubPreferences) {
  const category = getPreferenceCategory(preferences.fanCategory);
  const favorite = preferences.favorite || category.options[0];
  const isSport = preferences.fanCategory.includes("football") || preferences.fanCategory.includes("basketball");
  const isNews = preferences.fanCategory.includes("news");
  const isCareer = preferences.fanCategory === "career";
  const isMusic = preferences.fanCategory === "music";
  const isCartoon = preferences.fanCategory === "cartoons";

  const themeName = isSport
    ? "Matchday Hub"
    : isNews
      ? "Daily Briefing Desk"
      : isCareer
        ? "Career Pathway Lab"
        : isMusic
          ? "Learning Studio"
          : isCartoon
            ? "Hero Mission Map"
            : "Quest Arcade";

  const alert = isSport
    ? `Your Matchday Mission is live. Complete today's quiz and climb the ${favorite} table.`
    : isNews
      ? "Today's knowledge brief is ready. Learn from real-world headlines."
      : isCareer
        ? `Your ${preferences.courseInterest} pathway recommends a practical portfolio mission.`
        : isMusic
          ? "Keep your rhythm. One lesson today keeps your streak alive."
          : isCartoon
            ? "Hero Mission Unlocked. Solve today's challenge and earn a power badge."
            : "New Quest Available. Complete one short lesson and earn XP.";

  return {
    themeName,
    badge: isSport ? "Field Commander" : isNews ? "Briefing Captain" : isCareer ? "Pathway Builder" : isMusic ? "Rhythm Streaker" : isCartoon ? "Power Badge" : "XP Explorer",
    challenge: isSport ? "Map Your Stadium Challenge" : isNews ? "Current Affairs Map Brief" : isCareer ? "Portfolio Builder Sprint" : isMusic ? "Beat Drop Module" : isCartoon ? "Hero Mission Sprint" : "Level Up Quest",
    alert,
    recommendationScore: 86,
    recommendationParts: ["Preference Match", "Learning Goal Match", "Course Level Fit", "Cohort Activity", "Recent Engagement", "Completion Probability", "Diversity Bonus", "Fatigue Penalty"],
  };
}
