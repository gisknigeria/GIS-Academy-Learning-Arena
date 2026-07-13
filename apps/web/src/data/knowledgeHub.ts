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
};

export type PreferenceCategory = {
  key: PreferenceCategoryKey;
  label: string;
  options: string[];
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

export function saveKnowledgeHubPreferences(preferences: KnowledgeHubPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KNOWLEDGE_HUB_STORAGE_KEY, JSON.stringify(preferences));
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
