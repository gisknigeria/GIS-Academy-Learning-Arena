import {
  CalendarDays,
  CheckCircle2,
  Flame,
  GraduationCap,
  Map,
  Medal,
  Play,
  RadioTower,
  ShieldCheck,
  type LucideIcon,
  Zap,
} from "lucide-react";

export type Stat = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
};

export type Mission = {
  title: string;
  meta: string;
  action: string;
  icon: LucideIcon;
  tone: "green" | "orange" | "blue";
};

export const stats: Stat[] = [
  { label: "Learning progress", value: "68%", note: "+12% this week", icon: GraduationCap },
  { label: "Arena points", value: "14,280", note: "Gold league", icon: Zap },
  { label: "Current streak", value: "11 days", note: "Keep it alive", icon: Flame },
  { label: "National rank", value: "#24", note: "Top 3%", icon: Medal },
];

export const missions: Mission[] = [
  {
    title: "Continue GIS 200: Spatial Analysis",
    meta: "Next lesson: Buffer, overlay and evidence mapping",
    action: "Resume",
    icon: Play,
    tone: "green",
  },
  {
    title: "Submit QGIS practical map",
    meta: "Due today at 6:00 PM",
    action: "Upload",
    icon: Map,
    tone: "orange",
  },
  {
    title: "Join live Location Intelligence Battle",
    meta: "Starts in 18 minutes, 42 players waiting",
    action: "Join",
    icon: RadioTower,
    tone: "blue",
  },
];

export const competitions = [
  { name: "Oyo State GIS Olympiad", type: "School teams", status: "Live lobby", players: 428 },
  { name: "ArcGIS Speed Mapping Clash", type: "Individual", status: "Starts soon", players: 64 },
  { name: "Climate Risk Analytics Cup", type: "Group battle", status: "Open", players: 19 },
];

export const leaderboard = [
  { rank: 1, name: "Amina Yusuf", area: "Kaduna", score: "18,920" },
  { rank: 2, name: "Tobi Adewale", area: "Oyo", score: "18,310" },
  { rank: 3, name: "Chika Nwosu", area: "Lagos", score: "17,860" },
  { rank: 24, name: "You", area: "Ibadan", score: "14,280", self: true },
];

export const trainerReview = {
  icon: ShieldCheck,
  checks: [
    { label: "Data quality", icon: CheckCircle2 },
    { label: "Projection", icon: CheckCircle2 },
    { label: "Resubmit by Friday", icon: CalendarDays },
  ],
};
