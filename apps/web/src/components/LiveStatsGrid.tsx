import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Medal,
  RadioTower,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { DashboardStat } from "../lib/dashboard-api";

const KEY_ICONS: Record<string, LucideIcon> = {
  progress:     GraduationCap,
  lessons:      BookOpen,
  competitions: Trophy,
  rank:         Medal,
  users:        Users,
  learners:     Users,
  courses:      BookOpen,
  pending:      ShieldCheck,
  certificates: Award,
  submissions:  ClipboardCheck,
  attempts:     BarChart3,
  classes:      Users,
  live:         RadioTower,
  participants: Users,
  default:      CheckCircle2,
};

// Tone tinting per stat key
const KEY_TONE: Record<string, string> = {
  progress:     "green",
  lessons:      "green",
  competitions: "orange",
  rank:         "purple",
  users:        "blue",
  learners:     "blue",
  courses:      "green",
  pending:      "orange",
  certificates: "gold",
  submissions:  "orange",
  attempts:     "blue",
  classes:      "blue",
  live:         "red",
  participants: "blue",
};

function parseTrend(note: string): "up" | "down" | "neutral" {
  if (/^\+|increase|improve|up|top/i.test(note)) return "up";
  if (/-[0-9]|declin|below|drop|down/i.test(note)) return "down";
  return "neutral";
}

type LiveStatsGridProps = { stats: DashboardStat[] };

export function LiveStatsGrid({ stats }: LiveStatsGridProps) {
  return (
    <section className="stats-grid-v2" aria-label="Progress summary">
      {stats.map((stat) => {
        const Icon  = KEY_ICONS[stat.key] ?? KEY_ICONS.default;
        const tone  = KEY_TONE[stat.key]  ?? "green";
        const trend = parseTrend(stat.note);

        return (
          <article
            className={`stat-card-v2 stat-card-v2--${tone}`}
            key={stat.key}
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <div className="stat-card-v2-top">
              <div className="stat-card-v2-icon">
                <Icon size={18} aria-hidden="true" />
              </div>
              {trend !== "neutral" && (
                <span className={`stat-trend stat-trend--${trend}`} aria-hidden="true">
                  {trend === "up"
                    ? <TrendingUp size={13} />
                    : <TrendingDown size={13} />}
                </span>
              )}
            </div>

            <div className="stat-card-v2-value">{stat.value}</div>
            <div className="stat-card-v2-label">{stat.label}</div>
            <div className="stat-card-v2-note">{stat.note}</div>
          </article>
        );
      })}
    </section>
  );
}
