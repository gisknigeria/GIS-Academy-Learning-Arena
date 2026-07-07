import { Flame, X } from "lucide-react";
import { useEffect } from "react";
import { sounds } from "../lib/sound";

type Props = {
  streak: number;
  onClose: () => void;
};

const MILESTONE_COPY: Record<number, { title: string; body: string }> = {
  3:  { title: "3-Day Streak!",  body: "You're warming up. Keep the momentum going!" },
  7:  { title: "7-Day Streak!",  body: "One full week of learning. You're on fire 🔥" },
  14: { title: "14-Day Streak!", body: "Two weeks strong. You're unstoppable!" },
  21: { title: "21-Day Streak!", body: "Three weeks — this is a habit now. Legend status!" },
  30: { title: "30-Day Streak!", body: "One month of daily GIS learning. Elite tier." },
};

function getMilestoneCopy(streak: number) {
  // Find the highest milestone that matches or is below current streak
  const keys = Object.keys(MILESTONE_COPY).map(Number).sort((a, b) => b - a);
  const match = keys.find((k) => streak >= k);
  return match ? MILESTONE_COPY[match] : null;
}

export function StreakRewardModal({ streak, onClose }: Props) {
  const copy = getMilestoneCopy(streak);

  useEffect(() => {
    sounds.streakMilestone();
  }, []);

  if (!copy) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="streak-modal-title">
      <section className="streak-modal">
        <button className="streak-modal-close icon-button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {/* Animated flame */}
        <div className="streak-modal-orb" aria-hidden="true">
          <Flame size={44} />
        </div>

        <div className="streak-confetti" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={`confetti-dot confetti-dot--${(i % 4) + 1}`} />
          ))}
        </div>

        <h2 id="streak-modal-title">{copy.title}</h2>
        <p>{copy.body}</p>

        <div className="streak-modal-badge">
          <Flame size={16} />
          {streak} day streak
        </div>

        <button className="primary-button" onClick={onClose}>
          Keep it up!
        </button>
      </section>
    </div>
  );
}

/** Returns true if the streak value is a milestone worth celebrating */
export function isStreakMilestone(streak: number): boolean {
  return [3, 7, 14, 21, 30, 60, 90, 180, 365].includes(streak);
}
