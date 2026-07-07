import { Award, Gem, Map, Shield, Star, Trophy, Zap } from "lucide-react";
import { useEffect } from "react";
import { sounds } from "../lib/sound";

// ─── Badge definitions (frontend display only) ────────────────────────────────

export type BadgeDefinition = {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "gold" | "green" | "blue" | "purple" | "orange";
};

export const BADGE_REGISTRY: Record<string, BadgeDefinition> = {
  first_lesson: {
    key: "first_lesson",
    title: "First Steps",
    description: "Completed your first lesson",
    icon: <Map size={28} />,
    color: "green",
  },
  quest_warrior: {
    key: "quest_warrior",
    title: "Quest Warrior",
    description: "Completed 10 daily quests",
    icon: <Shield size={28} />,
    color: "blue",
  },
  streak_7: {
    key: "streak_7",
    title: "Week Warrior",
    description: "Maintained a 7-day streak",
    icon: <Zap size={28} />,
    color: "orange",
  },
  streak_30: {
    key: "streak_30",
    title: "Month Master",
    description: "Maintained a 30-day streak",
    icon: <Trophy size={28} />,
    color: "gold",
  },
  arena_debut: {
    key: "arena_debut",
    title: "Arena Debut",
    description: "Entered your first competition",
    icon: <Star size={28} />,
    color: "purple",
  },
  gis_initiate: {
    key: "gis_initiate",
    title: "GIS Initiate",
    description: "Solved 5 GIS puzzles",
    icon: <Gem size={28} />,
    color: "green",
  },
  course_graduate: {
    key: "course_graduate",
    title: "Course Graduate",
    description: "Completed a full course",
    icon: <Award size={28} />,
    color: "gold",
  },
};

// ─── Pop-up toast badge ────────────────────────────────────────────────────────

type BadgeToastProps = {
  badgeKey: string;
  onClose: () => void;
};

export function AchievementBadgeToast({ badgeKey, onClose }: BadgeToastProps) {
  const badge = BADGE_REGISTRY[badgeKey];

  useEffect(() => {
    sounds.badgeEarned();
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!badge) return null;

  return (
    <div className={`achievement-toast achievement-toast--${badge.color}`} role="status">
      <div className="achievement-toast-icon">{badge.icon}</div>
      <div className="achievement-toast-body">
        <span className="achievement-toast-eyebrow">Achievement unlocked!</span>
        <strong>{badge.title}</strong>
        <span>{badge.description}</span>
      </div>
      <button
        className="achievement-toast-close"
        onClick={onClose}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ─── Static badge display card (for profile / leaderboard) ────────────────────

type BadgeCardProps = {
  badgeKey: string;
  earned?: boolean;
  awardedAt?: string;
};

export function AchievementBadgeCard({ badgeKey, earned = false, awardedAt }: BadgeCardProps) {
  const badge = BADGE_REGISTRY[badgeKey];
  if (!badge) return null;

  return (
    <div className={`badge-card ${earned ? `badge-card--earned badge-card--${badge.color}` : "badge-card--locked"}`}>
      <div className="badge-card-icon">{badge.icon}</div>
      <strong>{badge.title}</strong>
      <span>{badge.description}</span>
      {earned && awardedAt && (
        <small>{new Date(awardedAt).toLocaleDateString()}</small>
      )}
    </div>
  );
}
