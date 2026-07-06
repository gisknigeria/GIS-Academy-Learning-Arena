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
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { DashboardStat } from "../lib/dashboard-api";

const KEY_ICONS: Record<string, LucideIcon> = {
  progress: GraduationCap,
  lessons: BookOpen,
  competitions: Trophy,
  rank: Medal,
  users: Users,
  learners: Users,
  courses: BookOpen,
  pending: ShieldCheck,
  certificates: Award,
  submissions: ClipboardCheck,
  attempts: BarChart3,
  classes: Users,
  live: RadioTower,
  participants: Users,
  default: CheckCircle2,
};

type LiveStatsGridProps = {
  stats: DashboardStat[];
};

export function LiveStatsGrid({ stats }: LiveStatsGridProps) {
  return (
    <section className="stats-grid" aria-label="Progress summary">
      {stats.map((stat) => {
        const Icon = KEY_ICONS[stat.key] ?? KEY_ICONS.default;
        return (
          <article className="stat-card" key={stat.label}>
            <div className="stat-icon">
              <Icon size={19} />
            </div>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </article>
        );
      })}
    </section>
  );
}
