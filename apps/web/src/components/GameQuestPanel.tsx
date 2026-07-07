/**
 * GameQuestPanel
 *
 * Three real GIS mini-games on rotation:
 *  1. Map Puzzle Sprint  — match GIS concepts to their definitions
 *  2. Coordinate Chase   — identify the correct coordinate format
 *  3. Projection Pick    — choose the right map projection for a use-case
 *
 * Progress persists to backend via usePlayerXP. Sound feedback via SoundManager.
 * Streak milestones trigger StreakRewardModal.
 */

import {
  Brain,
  CheckCircle2,
  Flame,
  Gem,
  Globe2,
  MapPin,
  MapPinned,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayerXP } from "../hooks/usePlayerXP";
import { isSoundEnabled, sounds, toggleSound } from "../lib/sound";
import { AchievementBadgeToast } from "./AchievementBadge";
import { isStreakMilestone, StreakRewardModal } from "./StreakRewardModal";

// ─── Mini-game data ────────────────────────────────────────────────────────────

type Question = {
  id: string;
  question: string;
  options: string[];
  correct: number; // index
  explanation: string;
};

const MAP_PUZZLE_QUESTIONS: Question[] = [
  {
    id: "buffer",
    question: "A Buffer analysis creates…",
    options: ["A colour-coded heat map", "A distance zone around a feature", "A 3D terrain model", "A satellite image composite"],
    correct: 1,
    explanation: "Buffers define zones within a specified distance from features like roads or water bodies.",
  },
  {
    id: "raster",
    question: "Raster data stores information as…",
    options: ["Points, lines and polygons", "SQL database tables", "A grid of cells (pixels)", "Vector coordinates"],
    correct: 2,
    explanation: "Raster data uses a grid structure where each cell holds a value — ideal for continuous data like elevation.",
  },
  {
    id: "vector",
    question: "Which best describes Vector data?",
    options: ["Pixel grid with colour values", "Points, lines and polygons", "Satellite imagery bands", "DEM height matrices"],
    correct: 1,
    explanation: "Vector data represents real-world features with geometric shapes — points, polylines, or polygons.",
  },
  {
    id: "overlay",
    question: "A spatial overlay operation…",
    options: ["Adds satellite bands together", "Combines two layers by geography", "Projects coordinates to WGS84", "Clips raster to vector extent"],
    correct: 1,
    explanation: "Overlay operations combine attributes from multiple layers based on their spatial relationships.",
  },
  {
    id: "crs",
    question: "WGS84 is a…",
    options: ["Map projection", "Coordinate Reference System", "Raster file format", "Spatial query language"],
    correct: 1,
    explanation: "WGS84 (World Geodetic System 1984) is the global datum used by GPS and most web maps.",
  },
];

const COORDINATE_QUESTIONS: Question[] = [
  {
    id: "latlon",
    question: "Which coordinate pair is valid Latitude, Longitude (WGS84)?",
    options: ["91.5, 45.2", "8.9475, 7.3536", "200, -300", "720000, 540000"],
    correct: 1,
    explanation: "Latitude ranges ‑90° to +90°, Longitude ‑180° to +180°. 8.9475, 7.3536 is near Abuja, Nigeria.",
  },
  {
    id: "utm",
    question: "UTM coordinates are expressed in…",
    options: ["Degrees decimal", "Radians", "Meters (Easting, Northing)", "Feet and inches"],
    correct: 2,
    explanation: "Universal Transverse Mercator (UTM) uses meters, split into 60 zones around the globe.",
  },
  {
    id: "epsg",
    question: "EPSG:4326 refers to…",
    options: ["Web Mercator", "WGS84 geographic coordinates", "UTM Zone 32N", "Nigerian Minna datum"],
    correct: 1,
    explanation: "EPSG:4326 is the standard code for WGS84 latitude/longitude, used by most global datasets.",
  },
  {
    id: "dms",
    question: "6° 27' 36\" N is the same as approximately…",
    options: ["6.41°", "6.46°", "6.53°", "6.38°"],
    correct: 1,
    explanation: "Convert: 27'/60 = 0.45, 36'/3600 = 0.01, total = 6 + 0.45 + 0.01 = 6.46°.",
  },
  {
    id: "geoid",
    question: "A Geoid model is used to define…",
    options: ["Satellite orbital paths", "Mean sea level surface", "Vector line simplification", "Raster resolution"],
    correct: 1,
    explanation: "A geoid represents the equipotential surface of Earth's gravity field, approximating mean sea level.",
  },
];

const PROJECTION_QUESTIONS: Question[] = [
  {
    id: "webmerc",
    question: "Web Mercator (EPSG:3857) is best for…",
    options: ["Area calculations in Africa", "Global web tile maps", "Equal-area analysis", "Polar navigation"],
    correct: 1,
    explanation: "Web Mercator preserves local shape and is standard for web mapping (Google Maps, OpenStreetMap).",
  },
  {
    id: "albers",
    question: "Albers Equal-Area Conic projection is preferred for…",
    options: ["City-level navigation", "Country-wide land use analysis", "Ocean depth mapping", "Real-time GPS tracking"],
    correct: 1,
    explanation: "Albers preserves area accurately across large mid-latitude regions — ideal for land use comparisons.",
  },
  {
    id: "azimuthal",
    question: "An Azimuthal Equidistant projection is best for…",
    options: ["Street-level routing", "Showing true distance from one point", "Displaying time zones", "Depicting ocean currents"],
    correct: 1,
    explanation: "Azimuthal Equidistant accurately preserves distances radiating from a single centre point.",
  },
  {
    id: "conformal",
    question: "Conformal projections preserve…",
    options: ["Area", "Distance", "Shape (local angles)", "Volume"],
    correct: 2,
    explanation: "Conformal projections maintain local angles and shapes — important for navigation and meteorology.",
  },
  {
    id: "nigeria",
    question: "Nigeria's official mapping uses which local datum?",
    options: ["WGS84", "Clarke 1880 (Minna)", "GRS80", "NAD83"],
    correct: 1,
    explanation: "Nigeria uses the Minna datum based on the Clarke 1880 ellipsoid for official topographic maps.",
  },
];

// ─── Game definitions ─────────────────────────────────────────────────────────

type GameId = "puzzle" | "coordinate" | "projection";

const GAMES: {
  id: GameId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  questions: Question[];
  xp: number;
}[] = [
  {
    id: "puzzle",
    title: "Map Puzzle Sprint",
    subtitle: "Match GIS concepts to their definitions.",
    icon: <MapPinned size={26} />,
    questions: MAP_PUZZLE_QUESTIONS,
    xp: 120,
  },
  {
    id: "coordinate",
    title: "Coordinate Chase",
    subtitle: "Identify correct coordinate formats and systems.",
    icon: <MapPin size={26} />,
    questions: COORDINATE_QUESTIONS,
    xp: 100,
  },
  {
    id: "projection",
    title: "Projection Pick",
    subtitle: "Choose the right projection for each scenario.",
    icon: <Globe2 size={26} />,
    questions: PROJECTION_QUESTIONS,
    xp: 110,
  },
];

// ─── Local storage helpers ────────────────────────────────────────────────────

const QUEST_KEY = "gis_quest_progress";
const STREAK_KEY = "gis_quest_streak";
const LAST_DATE_KEY = "gis_quest_last_date";

function loadQuestProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(QUEST_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveQuestProgress(solved: Set<string>) {
  localStorage.setItem(QUEST_KEY, JSON.stringify([...solved]));
}

function loadStreak(): number {
  const raw = localStorage.getItem(STREAK_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

function saveStreak(n: number) {
  localStorage.setItem(STREAK_KEY, String(n));
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkAndUpdateStreak(): { streak: number; isNewDay: boolean } {
  const lastDate = localStorage.getItem(LAST_DATE_KEY) ?? "";
  const today = getToday();
  const streak = loadStreak();

  if (lastDate === today) {
    return { streak, isNewDay: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak = lastDate === yesterdayStr ? streak + 1 : 1;
  localStorage.setItem(LAST_DATE_KEY, today);
  saveStreak(newStreak);
  return { streak: newStreak, isNewDay: true };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GameQuestPanel() {
  const { awardXP, awardBadge } = usePlayerXP();
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [solved, setSolved] = useState<Set<string>>(() => loadQuestProgress());
  const [streak, setStreak] = useState(loadStreak);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);

  const game = GAMES[activeGameIdx];
  const questions = game.questions;
  const question = questions[currentQ];

  // Check streak on first mount
  useEffect(() => {
    const { streak: newStreak, isNewDay } = checkAndUpdateStreak();
    setStreak(newStreak);
    if (isNewDay && isStreakMilestone(newStreak)) {
      setTimeout(() => setShowStreakModal(true), 800);
    }
  }, []);

  const solvedForGame = useMemo(
    () => questions.filter((q) => solved.has(`${game.id}:${q.id}`)).length,
    [solved, questions, game.id],
  );
  const totalForGame = questions.length;
  const progress = Math.round((solvedForGame / totalForGame) * 100);
  const allSolved = solvedForGame === totalForGame;

  function selectOption(idx: number) {
    if (confirmed) return;
    if (soundOn) sounds.click();
    setSelected(idx);
  }

  function confirm() {
    if (selected === null || confirmed) return;
    setConfirmed(true);

    const isCorrect = selected === question.correct;

    if (isCorrect) {
      if (soundOn) sounds.tileSuccess();
      const key = `${game.id}:${question.id}`;
      const next = new Set(solved);
      next.add(key);
      setSolved(next);
      saveQuestProgress(next);
      void awardXP("puzzle_solved", { game: game.id, questionId: question.id });

      // Check quest completion
      const newSolvedCount = next.size;
      const gameTotal = questions.filter((q) => next.has(`${game.id}:${q.id}`)).length;
      if (gameTotal === totalForGame) {
        setTimeout(() => {
          if (soundOn) sounds.questComplete();
        }, 400);
        void awardXP("quest_complete", { game: game.id });
        // Award GIS Initiate badge after 5 total solves
        if (newSolvedCount >= 5) {
          void awardBadge("gis_initiate");
          setBadgeToast("gis_initiate");
        }
      }
    } else {
      if (soundOn) sounds.wrong();
    }
  }

  function nextQuestion() {
    const nextIdx = (currentQ + 1) % questions.length;
    setCurrentQ(nextIdx);
    setSelected(null);
    setConfirmed(false);
  }

  function resetGame() {
    setCurrentQ(0);
    setSelected(null);
    setConfirmed(false);
  }

  function switchGame(idx: number) {
    setActiveGameIdx(idx);
    setCurrentQ(0);
    setSelected(null);
    setConfirmed(false);
  }

  function handleSoundToggle() {
    const on = toggleSound();
    setSoundOn(on);
  }

  const isCorrectAnswer = confirmed && selected === question.correct;
  const isWrongAnswer = confirmed && selected !== question.correct;

  return (
    <>
      <section className="game-quest-panel" aria-label="Daily GIS mini-games">
        {/* ── Main card ── */}
        <div className="quest-card quest-card-main">
          {/* Header */}
          <div className="quest-card-header">
            <span className="quest-badge">
              <Sparkles size={14} />
              Daily quest
            </span>
            <div className="quest-card-header-right">
              <span className="quest-xp">
                <Gem size={14} />
                +{game.xp} XP
              </span>
              <button
                className="sound-toggle-btn"
                onClick={handleSoundToggle}
                aria-label={soundOn ? "Mute sounds" : "Enable sounds"}
                title={soundOn ? "Sounds on" : "Sounds off"}
              >
                {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>
          </div>

          {/* Game switcher tabs */}
          <div className="quest-game-tabs" role="tablist">
            {GAMES.map((g, i) => {
              const gameSolved = g.questions.filter((q) => solved.has(`${g.id}:${q.id}`)).length;
              const complete = gameSolved === g.questions.length;
              return (
                <button
                  key={g.id}
                  role="tab"
                  aria-selected={i === activeGameIdx}
                  className={`quest-game-tab ${i === activeGameIdx ? "is-active" : ""} ${complete ? "is-complete" : ""}`}
                  onClick={() => switchGame(i)}
                  title={g.title}
                >
                  {complete ? <CheckCircle2 size={14} /> : g.icon}
                  <span>{g.title}</span>
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div className="quest-title-row">
            <div className="quest-orb">{game.icon}</div>
            <div>
              <h2>{game.title}</h2>
              <p>{game.subtitle}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="quest-progress">
            <div className="quest-progress-top">
              <strong>{progress}% complete</strong>
              <span>{solvedForGame}/{totalForGame} solved</span>
            </div>
            <div className="quest-progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question */}
          {!allSolved ? (
            <div className="mini-game-question-area">
              <p className="mini-game-question-counter">
                Question {currentQ + 1} of {questions.length}
              </p>
              <p className="mini-game-question-text">{question.question}</p>

              <div className="mini-game-options">
                {question.options.map((opt, i) => {
                  let cls = "mini-game-option";
                  if (selected === i && !confirmed) cls += " is-selected";
                  if (confirmed && i === question.correct) cls += " is-correct";
                  if (confirmed && selected === i && i !== question.correct) cls += " is-wrong";
                  return (
                    <button
                      key={i}
                      className={cls}
                      onClick={() => selectOption(i)}
                      disabled={confirmed}
                      type="button"
                    >
                      <span className="mini-game-option-letter">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {confirmed && (
                <div className={`mini-game-feedback ${isCorrectAnswer ? "is-correct" : "is-wrong"}`}>
                  {isCorrectAnswer ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Correct! {question.explanation}</span>
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      <span>
                        Not quite. Correct: <strong>{question.options[question.correct]}</strong>.{" "}
                        {question.explanation}
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="mini-game-actions">
                {!confirmed ? (
                  <button
                    className="primary-button small-button"
                    onClick={confirm}
                    disabled={selected === null}
                    type="button"
                  >
                    <Trophy size={15} />
                    Confirm
                  </button>
                ) : (
                  <button
                    className="primary-button small-button"
                    onClick={nextQuestion}
                    type="button"
                  >
                    Next question →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mini-game-complete">
              <CheckCircle2 size={32} />
              <strong>All {totalForGame} questions cleared!</strong>
              <p>Switch to another game or come back tomorrow for new puzzles.</p>
              <button
                className="quest-reset-button"
                onClick={resetGame}
                type="button"
              >
                <RotateCcw size={16} />
                Review questions
              </button>
            </div>
          )}
        </div>

        {/* ── Side stack ── */}
        <div className="quest-side-stack">
          <article className="mini-game-card">
            <Flame size={20} />
            <div>
              <strong>{streak} day streak</strong>
              <span>Complete one quest daily to keep your streak alive.</span>
            </div>
          </article>

          <article className="mini-game-card">
            <Trophy size={20} />
            <div>
              <strong>{solvedForGame}/{totalForGame} solved today</strong>
              <span>{game.title} — {allSolved ? "All done!" : "Keep going!"}</span>
            </div>
          </article>

          {/* Game overview progress */}
          {GAMES.map((g) => {
            const gameSolved = g.questions.filter((q) => solved.has(`${g.id}:${q.id}`)).length;
            const pct = Math.round((gameSolved / g.questions.length) * 100);
            return (
              <article key={g.id} className="mini-game-card mini-game-card--progress">
                <div className="mini-game-card-icon">{g.icon}</div>
                <div>
                  <strong>{g.title}</strong>
                  <div className="mini-game-mini-bar">
                    <div style={{ width: `${pct}%` }} />
                  </div>
                  <span>{gameSolved}/{g.questions.length}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Modals / toasts ── */}
      {showStreakModal && (
        <StreakRewardModal streak={streak} onClose={() => setShowStreakModal(false)} />
      )}
      {badgeToast && (
        <AchievementBadgeToast badgeKey={badgeToast} onClose={() => setBadgeToast(null)} />
      )}
    </>
  );
}
