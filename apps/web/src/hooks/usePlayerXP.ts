/**
 * usePlayerXP
 *
 * Central hook for awarding XP and triggering streak-reward / achievement
 * notifications. All calls are fire-and-forget — failures are silently swallowed
 * so they never break the learning flow.
 */
import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { playersApi } from "../lib/players-api";

export type XPEvent =
  | "lesson_complete"    // +50 XP, +30 pts
  | "puzzle_solved"      // +20 XP, +10 pts
  | "quest_complete"     // +120 XP, +60 pts  (all puzzles done)
  | "quiz_pass"          // +80 XP, +40 pts
  | "competition_enter"  // +10 XP
  | "daily_login"        // +15 XP, +5 pts
  | "streak_milestone";  // +60 XP, +25 pts

const XP_TABLE: Record<XPEvent, { xp: number; points: number; reason: string }> = {
  lesson_complete:   { xp: 50,  points: 30, reason: "Lesson completed" },
  puzzle_solved:     { xp: 20,  points: 10, reason: "Puzzle solved" },
  quest_complete:    { xp: 120, points: 60, reason: "Daily quest completed" },
  quiz_pass:         { xp: 80,  points: 40, reason: "Assessment passed" },
  competition_enter: { xp: 10,  points: 0,  reason: "Entered competition" },
  daily_login:       { xp: 15,  points: 5,  reason: "Daily login bonus" },
  streak_milestone:  { xp: 60,  points: 25, reason: "Streak milestone reached" },
};

export function usePlayerXP() {
  const { user, token } = useAuth();

  const awardXP = useCallback(
    async (event: XPEvent, meta?: Record<string, unknown>): Promise<void> => {
      if (!user || !token) return;
      const entry = XP_TABLE[event];
      try {
        await playersApi.reward(token, user.id, {
          event,
          reason: entry.reason,
          points: entry.points,
          xp: entry.xp,
          streak: typeof meta?.streak === "number" ? meta.streak : undefined,
          meta: {
            event,
            ...meta,
          },
        });
        window.dispatchEvent(new CustomEvent("player:rewarded", { detail: { event } }));
      } catch {
        // Fire-and-forget — never block the user
      }
    },
    [user, token],
  );

  const awardBadge = useCallback(
    async (badgeKey: string): Promise<void> => {
      if (!user || !token) return;
      try {
        await playersApi.awardBadge(token, user.id, badgeKey);
        window.dispatchEvent(new CustomEvent("player:rewarded", { detail: { event: "badge_awarded", badgeKey } }));
      } catch {
        // Badge may already be earned — ignore
      }
    },
    [user, token],
  );

  return { awardXP, awardBadge };
}
