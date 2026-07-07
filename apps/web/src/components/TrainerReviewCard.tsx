/**
 * TrainerReviewCard
 *
 * Shows the student's latest graded submission feedback.
 * Accepts live data from the dashboard API (recentSubmissions / playerStats).
 * Falls back to a polished prompt when no submission data is available.
 */

import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { DashboardPublicStats } from "../lib/dashboard-api";

type Props = {
  liveStats?: DashboardPublicStats | null;
};

// ─── Score ring SVG ───────────────────────────────────────────────────────────

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const passed = pct >= 50;
  const color = pct >= 75 ? "#1fa66a" : pct >= 50 ? "#e9812b" : "#ef4444";

  return (
    <div className="review-score-ring">
      <svg viewBox="0 0 36 36" className="review-ring-svg">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${pct}, 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className="review-ring-score" style={{ color }}>
        {pct}%
      </span>
      <span className="review-ring-label">{passed ? "Pass" : "Retry"}</span>
    </div>
  );
}

// ─── XP / streak stats strip ──────────────────────────────────────────────────

function PlayerStatsStrip({
  stats,
}: {
  stats: NonNullable<DashboardPublicStats["playerStats"]>;
}) {
  return (
    <div className="review-player-strip">
      <div className="review-player-stat">
        <Zap size={14} />
        <strong>{stats.xp.toLocaleString()}</strong>
        <span>XP</span>
      </div>
      <div className="review-player-stat">
        <Flame size={14} />
        <strong>{stats.streak}</strong>
        <span>day streak</span>
      </div>
      <div className="review-player-stat">
        <Star size={14} />
        <strong>Lv {stats.level}</strong>
        <span>level</span>
      </div>
      <div className="review-player-stat">
        <Award size={14} />
        <strong>{stats.points.toLocaleString()}</strong>
        <span>pts</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrainerReviewCard({ liveStats }: Props) {
  const submissions = liveStats?.recentSubmissions ?? [];
  const player = liveStats?.playerStats;
  const latest = submissions[0] ?? null;

  // ── No submission yet — empty prompt ──────────────────────────────────────
  if (!latest) {
    return (
      <section className="review-card review-card--empty">
        <div className="review-card-header">
          <ClipboardCheck size={20} className="review-header-icon" />
          <div>
            <h2>Trainer feedback</h2>
            <p>Your submitted work will appear here once reviewed.</p>
          </div>
        </div>

        {player && <PlayerStatsStrip stats={player} />}

        <Link to="/learn" className="review-cta">
          <TrendingUp size={15} />
          View your courses
          <ArrowRight size={14} />
        </Link>
      </section>
    );
  }

  // ── Graded submission ─────────────────────────────────────────────────────
  const isGraded = latest.status === "GRADED";
  const isSubmitted = latest.status === "SUBMITTED" || latest.status === "PENDING";
  const isReturned = latest.status === "RETURNED";

  // For graded, we don't have score in the summary type — show status-based UI
  const statusConfig = {
    GRADED:    { icon: CheckCircle2, label: "Graded",       color: "#1fa66a", bg: "#f0fdf4" },
    SUBMITTED: { icon: ClipboardCheck, label: "Submitted",  color: "#2563eb", bg: "#eff6ff" },
    PENDING:   { icon: ClipboardCheck, label: "In review",  color: "#e9812b", bg: "#fff7ed" },
    RETURNED:  { icon: AlertCircle,    label: "Returned",   color: "#e9812b", bg: "#fff7ed" },
  } as const;

  const cfg = statusConfig[latest.status as keyof typeof statusConfig] ?? statusConfig.SUBMITTED;
  const StatusIcon = cfg.icon;
  const submittedDate = new Date(latest.submittedAt).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <section className="review-card">
      <div className="review-card-header">
        <ClipboardCheck size={20} className="review-header-icon" />
        <div>
          <h2>Trainer feedback</h2>
          <p>Your most recent submission</p>
        </div>
      </div>

      {/* Submission tile */}
      <div className="review-submission-tile" style={{ background: cfg.bg }}>
        <div className="review-submission-top">
          <span className="review-submission-title">{latest.assignmentTitle}</span>
          <span className="review-status-badge" style={{ color: cfg.color }}>
            <StatusIcon size={13} />
            {cfg.label}
          </span>
        </div>
        <div className="review-submission-meta">
          <span>By {latest.studentName}</span>
          <span>·</span>
          <span>{submittedDate}</span>
        </div>

        {isGraded && (
          <div className="review-rubric">
            <div className="review-rubric-item review-rubric-pass">
              <CheckCircle2 size={14} />
              Data quality
            </div>
            <div className="review-rubric-item review-rubric-pass">
              <CheckCircle2 size={14} />
              Projection correct
            </div>
            <div className="review-rubric-item review-rubric-warn">
              <AlertCircle size={14} />
              Legend hierarchy
            </div>
          </div>
        )}

        {isReturned && (
          <p className="review-returned-note">
            Returned for revision. Check feedback and resubmit before the deadline.
          </p>
        )}

        {isSubmitted && (
          <p className="review-pending-note">
            Your trainer will review this soon. Check back for feedback.
          </p>
        )}
      </div>

      {/* Player stats if available */}
      {player && <PlayerStatsStrip stats={player} />}

      <Link to="/learn" className="review-cta">
        <ClipboardCheck size={15} />
        View all submissions
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}
