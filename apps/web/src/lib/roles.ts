import type { UserRole } from "../types/auth";
import type { PageId } from "../types/navigation";

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TRAINING_MANAGER: "Training Manager",
  TRAINER: "Trainer",
  STUDENT: "Student",
  CORPORATE_CLIENT: "Corporate Client",
  SCHOOL_COORDINATOR: "School Coordinator",
  OLYMPIAD_COORDINATOR: "Olympiad Coordinator",
  EXAMINER: "Examiner",
  JUDGE: "Judge",
  GUEST: "Guest",
  ALUMNI: "Alumni",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

export const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "TRAINING_MANAGER",
];

export const INSTRUCTOR_ROLES: UserRole[] = [
  "TRAINER",
  "EXAMINER",
  "JUDGE",
];

export const COORDINATOR_ROLES: UserRole[] = [
  "SCHOOL_COORDINATOR",
  "CORPORATE_CLIENT",
  "OLYMPIAD_COORDINATOR",
];

export const LEARNER_ROLES: UserRole[] = [
  "STUDENT",
  "ALUMNI",
  "GUEST",
];

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isInstructorRole(role: UserRole): boolean {
  return INSTRUCTOR_ROLES.includes(role);
}

export function isCoordinatorRole(role: UserRole): boolean {
  return COORDINATOR_ROLES.includes(role);
}

export function isLearnerRole(role: UserRole): boolean {
  return LEARNER_ROLES.includes(role);
}

export function getVisibleNavPages(role: UserRole): Set<PageId> {
  const always: PageId[] = ["dashboard"];
  const byRole: Record<UserRole, PageId[]> = {
    SUPER_ADMIN: ["courses", "arena", "classes", "assessments", "certificates", "reports", "users"],
    ADMIN: ["courses", "arena", "classes", "assessments", "certificates", "reports", "users"],
    TRAINING_MANAGER: ["courses", "arena", "classes", "assessments", "certificates", "reports"],
    TRAINER: ["courses", "classes", "assessments"],
    STUDENT: ["knowledge", "courses", "learn", "arena", "assessments", "certificates"],
    CORPORATE_CLIENT: ["courses", "classes", "reports"],
    SCHOOL_COORDINATOR: ["courses", "classes", "assessments", "reports"],
    OLYMPIAD_COORDINATOR: ["arena", "reports"],
    EXAMINER: ["assessments", "classes"],
    JUDGE: ["arena"],
    GUEST: ["knowledge", "courses", "learn"],
    ALUMNI: ["knowledge", "courses", "learn", "arena", "certificates"],
  };

  return new Set([...always, ...(byRole[role] ?? [])]);
}
