import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Flame,
  GraduationCap,
  Map,
  Medal,
  Play,
  PlusCircle,
  RadioTower,
  Settings,
  ShieldCheck,
  Trophy,
  Upload,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "../types/auth";

// ─── Shared types ─────────────────────────────────────────────────────────────

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
  /** React Router path to navigate to when the action button is clicked */
  route: string;
  icon: LucideIcon;
  tone: "green" | "orange" | "blue";
};

export type QuickAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  tone: "green" | "orange" | "blue" | "purple";
};

// ─── Role-specific stats ──────────────────────────────────────────────────────

const studentStats: Stat[] = [
  { label: "Learning progress", value: "68%", note: "+12% this week", icon: GraduationCap },
  { label: "Arena points", value: "14,280", note: "Gold league", icon: Zap },
  { label: "Current streak", value: "11 days", note: "Keep it alive", icon: Flame },
  { label: "National rank", value: "#24", note: "Top 3%", icon: Medal },
];

const superAdminStats: Stat[] = [
  { label: "Total users", value: "1,284", note: "+18 this week", icon: Users },
  { label: "Active courses", value: "34", note: "6 pending review", icon: BookOpen },
  { label: "Payments due", value: "₦2.4M", note: "23 pending", icon: Award },
  { label: "Platform health", value: "99.2%", note: "All systems operational", icon: ShieldCheck },
];

const adminStats: Stat[] = [
  { label: "Active learners", value: "842", note: "+31 this week", icon: Users },
  { label: "Courses published", value: "28", note: "4 in draft", icon: BookOpen },
  { label: "Assessments due", value: "14", note: "Needs grading", icon: ClipboardList },
  { label: "Certificates issued", value: "193", note: "This month", icon: Award },
];

const trainingManagerStats: Stat[] = [
  { label: "Active classes", value: "12", note: "3 starting this week", icon: CalendarDays },
  { label: "Enrolled learners", value: "374", note: "Across all programs", icon: Users },
  { label: "Completion rate", value: "74%", note: "+6% vs last month", icon: CheckCircle2 },
  { label: "Pending approvals", value: "7", note: "Registrations to review", icon: AlertCircle },
];

const trainerStats: Stat[] = [
  { label: "My classes", value: "4", note: "2 active this week", icon: CalendarDays },
  { label: "Students assigned", value: "96", note: "Across all courses", icon: Users },
  { label: "Submissions pending", value: "11", note: "Awaiting your review", icon: ClipboardCheck },
  { label: "Avg. assessment score", value: "71%", note: "Last 30 days", icon: BarChart3 },
];

const coordinatorStats: Stat[] = [
  { label: "Registered learners", value: "56", note: "Your institution", icon: Users },
  { label: "Active enrollments", value: "43", note: "Across 6 courses", icon: BookOpenCheck },
  { label: "Completion rate", value: "61%", note: "Institution average", icon: CheckCircle2 },
  { label: "Upcoming classes", value: "3", note: "Next 7 days", icon: CalendarDays },
];

const olympiadStats: Stat[] = [
  { label: "Schools registered", value: "128", note: "3 days left to register", icon: Users },
  { label: "Participants", value: "2,840", note: "Across all schools", icon: GraduationCap },
  { label: "Live challenges", value: "4", note: "Running now", icon: RadioTower },
  { label: "Top school score", value: "18,920", note: "Kaduna State Academy", icon: Trophy },
];

export function getStatsByRole(role: UserRole): Stat[] {
  switch (role) {
    case "SUPER_ADMIN":
      return superAdminStats;
    case "ADMIN":
      return adminStats;
    case "TRAINING_MANAGER":
      return trainingManagerStats;
    case "TRAINER":
      return trainerStats;
    case "SCHOOL_COORDINATOR":
    case "CORPORATE_CLIENT":
      return coordinatorStats;
    case "OLYMPIAD_COORDINATOR":
    case "JUDGE":
      return olympiadStats;
    default:
      return studentStats;
  }
}

// ─── Role-specific missions ───────────────────────────────────────────────────

const studentMissions: Mission[] = [
  {
    title: "Continue GIS 200: Spatial Analysis",
    meta: "Next lesson: Buffer, overlay and evidence mapping",
    action: "Resume",
    route: "/learn",
    icon: Play,
    tone: "green",
  },
  {
    title: "Submit QGIS practical map",
    meta: "Due today at 6:00 PM",
    action: "Upload",
    route: "/learn",
    icon: Map,
    tone: "orange",
  },
  {
    title: "Join live Location Intelligence Battle",
    meta: "Starts in 18 minutes, 42 players waiting",
    action: "Join",
    route: "/arena",
    icon: RadioTower,
    tone: "blue",
  },
];

const superAdminMissions: Mission[] = [
  {
    title: "Approve 5 pending registrations",
    meta: "Users waiting for account activation",
    action: "Review",
    route: "/users",
    icon: UserCheck,
    tone: "orange",
  },
  {
    title: "Publish GIS 400: Advanced Remote Sensing",
    meta: "Course ready for review — 12 lessons complete",
    action: "Publish",
    route: "/courses",
    icon: BookOpen,
    tone: "green",
  },
  {
    title: "Review platform payment report",
    meta: "₦2.4M pending across 23 accounts",
    action: "Open",
    route: "/reports",
    icon: BarChart3,
    tone: "blue",
  },
];

const adminMissions: Mission[] = [
  {
    title: "Review 3 flagged submissions",
    meta: "Learner practicals awaiting moderation",
    action: "Review",
    route: "/assessments",
    icon: ClipboardCheck,
    tone: "orange",
  },
  {
    title: "Schedule GIS 300 live session",
    meta: "Proposed date: Friday 9 AM — confirm with trainer",
    action: "Schedule",
    route: "/classes",
    icon: CalendarDays,
    tone: "green",
  },
  {
    title: "Export learner progress report",
    meta: "Monthly summary due by end of week",
    action: "Export",
    route: "/reports",
    icon: BarChart3,
    tone: "blue",
  },
];

const trainingManagerMissions: Mission[] = [
  {
    title: "Update GIS 300 curriculum draft",
    meta: "New module on urban planning needs adding",
    action: "Edit",
    route: "/courses",
    icon: BookOpen,
    tone: "green",
  },
  {
    title: "Confirm 2 trainer assignments",
    meta: "Live sessions starting next Monday",
    action: "Confirm",
    route: "/classes",
    icon: UserCheck,
    tone: "orange",
  },
  {
    title: "Generate cohort performance report",
    meta: "Q2 batch — due to management by Friday",
    action: "Generate",
    route: "/reports",
    icon: BarChart3,
    tone: "blue",
  },
];

const trainerMissions: Mission[] = [
  {
    title: "Grade 11 pending practicals",
    meta: "GIS 200 — submissions from last Tuesday",
    action: "Grade",
    route: "/assessments",
    icon: ClipboardCheck,
    tone: "orange",
  },
  {
    title: "Upload lesson: Coordinate Reference Systems",
    meta: "GIS 300 — Week 4 material",
    action: "Upload",
    route: "/courses",
    icon: Upload,
    tone: "green",
  },
  {
    title: "Respond to 4 learner questions",
    meta: "Forum questions pending reply",
    action: "Reply",
    route: "/classes",
    icon: Play,
    tone: "blue",
  },
];

const coordinatorMissions: Mission[] = [
  {
    title: "Enroll 8 new team members",
    meta: "GIS Foundation Course — Q3 batch",
    action: "Enroll",
    route: "/classes",
    icon: UserCheck,
    tone: "green",
  },
  {
    title: "Review learner progress summary",
    meta: "3 participants are behind schedule",
    action: "Review",
    route: "/reports",
    icon: AlertCircle,
    tone: "orange",
  },
  {
    title: "Download completion certificates",
    meta: "5 learners completed GIS 100 this week",
    action: "Download",
    route: "/certificates",
    icon: Award,
    tone: "blue",
  },
];

const olympiadMissions: Mission[] = [
  {
    title: "Finalise bracket for School Olympiad",
    meta: "128 schools confirmed — draw closes tomorrow",
    action: "Finalise",
    route: "/arena",
    icon: Trophy,
    tone: "green",
  },
  {
    title: "Assign 3 judges to ArcGIS Speed Round",
    meta: "Round starts Saturday at 10 AM",
    action: "Assign",
    route: "/arena",
    icon: UserCheck,
    tone: "orange",
  },
  {
    title: "Review competition leaderboard",
    meta: "Live scores — 4 challenges active",
    action: "View",
    route: "/arena",
    icon: BarChart3,
    tone: "blue",
  },
];

export function getMissionsByRole(role: UserRole): Mission[] {
  switch (role) {
    case "SUPER_ADMIN":
      return superAdminMissions;
    case "ADMIN":
      return adminMissions;
    case "TRAINING_MANAGER":
      return trainingManagerMissions;
    case "TRAINER":
      return trainerMissions;
    case "SCHOOL_COORDINATOR":
    case "CORPORATE_CLIENT":
      return coordinatorMissions;
    case "OLYMPIAD_COORDINATOR":
    case "JUDGE":
      return olympiadMissions;
    default:
      return studentMissions;
  }
}

// ─── Quick actions (admin-style panels) ──────────────────────────────────────

export function getQuickActions(role: UserRole): QuickAction[] {
  switch (role) {
    case "SUPER_ADMIN":
      return [
        { label: "Add user", description: "Create admin, trainer, or student account", icon: Users, tone: "green" },
        { label: "New course", description: "Set up a new learning module", icon: PlusCircle, tone: "blue" },
        { label: "Platform settings", description: "Manage payment, access, branding", icon: Settings, tone: "purple" },
        { label: "Reports", description: "Platform-wide analytics & exports", icon: BarChart3, tone: "orange" },
      ];
    case "ADMIN":
      return [
        { label: "Approve registrations", description: "5 pending user accounts", icon: UserCheck, tone: "orange" },
        { label: "Publish course", description: "1 course ready for review", icon: BookOpen, tone: "green" },
        { label: "View reports", description: "Learner progress analytics", icon: BarChart3, tone: "blue" },
        { label: "Manage classes", description: "Schedule and assign trainers", icon: CalendarDays, tone: "purple" },
      ];
    case "TRAINING_MANAGER":
      return [
        { label: "Schedule class", description: "Set up next live session", icon: CalendarDays, tone: "green" },
        { label: "Assign trainer", description: "Match trainer to course", icon: UserCheck, tone: "blue" },
        { label: "New curriculum", description: "Draft a course outline", icon: BookOpen, tone: "orange" },
        { label: "Progress report", description: "Export cohort performance", icon: BarChart3, tone: "purple" },
      ];
    case "TRAINER":
      return [
        { label: "Upload lesson", description: "Add video or resource material", icon: Upload, tone: "green" },
        { label: "Grade practicals", description: "11 submissions pending", icon: ClipboardCheck, tone: "orange" },
        { label: "Set assessment", description: "Create quiz or practical task", icon: ClipboardList, tone: "blue" },
        { label: "Class attendance", description: "View this week's roster", icon: Users, tone: "purple" },
      ];
    default:
      return [];
  }
}

// ─── Static shared data ───────────────────────────────────────────────────────

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

// Legacy exports kept for any components that still import directly
export const stats = studentStats;
export const missions = studentMissions;
