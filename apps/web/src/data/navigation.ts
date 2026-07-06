import {
  Activity,
  Award,
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  Trophy,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PageId } from "../types/navigation";

export type NavigationItem = {
  id: PageId;
  label: string;
  icon: LucideIcon;
  path: string;
};

export const navItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Activity, path: "/dashboard" },
  { id: "courses", label: "Courses", icon: GraduationCap, path: "/courses" },
  { id: "learn", label: "Learn", icon: BookOpenCheck, path: "/learn" },
  { id: "arena", label: "Arena", icon: Trophy, path: "/arena" },
  { id: "classes", label: "Classes", icon: Users, path: "/classes" },
  { id: "assessments", label: "Assessments", icon: ClipboardList, path: "/assessments" },
  { id: "certificates", label: "Certificates", icon: Award, path: "/certificates" },
  { id: "reports", label: "Reports", icon: BarChart3, path: "/reports" },
  { id: "users", label: "Users", icon: UserCog, path: "/users" },
];
