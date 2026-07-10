import type { UserRole } from "../types/auth";

// ─── Role display helpers ────────────────────────────────────────────────────

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

// ─── Role groupings ──────────────────────────────────────────────────────────

/** Roles that manage the platform — see admin-oriented dashboards */
export const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "TRAINING_MANAGER",
];

/** Roles that deliver training content */
export const INSTRUCTOR_ROLES: UserRole[] = [
  "TRAINER",
  "EXAMINER",
  "JUDGE",
];

/** Roles that coordinate institutions or events */
export const COORDINATOR_ROLES: UserRole[] = [
  "SCHOOL_COORDINATOR",
  "CORPORATE_CLIENT",
  "OLYMPIAD_COORDINATOR",
];

/** Roles that consume training */
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

// ─── Navigation visibility ───────────────────────────────────────────────────

import type { PageId } from "../types/navigation";

/**
 * Returns the set of nav page IDs visible to a given role.
 * "dashboard" is always visible.
 */
export function getVisibleNavPages(role: UserRole): Set<PageId> {
  const always: PageId[] = ["dashboard", "knowledge"];

  const byRole: Record<UserRole, PageId[]> = {
    SUPER_ADMIN: ["courses", "learn", "arena", "classes", "assessments", "certificates", "reports", "users"],
    ADMIN: ["courses", "learn", "arena", "classes", "assessments", "certificates", "reports", "users"],
    TRAINING_MANAGER: ["courses", "learn", "classes", "assessments", "certificates", "reports"],
    TRAINER: ["courses", "learn", "classes", "assessments", "certificates"],
    STUDENT: ["courses", "learn", "arena", "assessments", "certificates"],
    CORPORATE_CLIENT: ["courses", "learn", "classes", "reports"],
    SCHOOL_COORDINATOR: ["courses", "learn", "classes", "assessments", "reports"],
    OLYMPIAD_COORDINATOR: ["arena", "reports"],
    EXAMINER: ["assessments", "classes"],
    JUDGE: ["arena"],
    GUEST: ["courses", "learn"],
    ALUMNI: ["courses", "learn", "arena", "certificates"],
  };

  return new Set([...always, ...(byRole[role] ?? [])]);
}

// ─── Coach panel copy per role ────────────────────────────────────────────────

export type CoachPanelConfig = {
  heading: string;
  body: string;
  cta: string;
};

export function getCoachPanel(role: UserRole): CoachPanelConfig {
  const map: Partial<Record<UserRole, CoachPanelConfig>> = {
    SUPER_ADMIN: {
      heading: "Platform health",
      body: "Review pending user approvals and check payment status before the day starts.",
      cta: "View users",
    },
    ADMIN: {
      heading: "Admin tasks",
      body: "2 new registrations await approval. 1 course is pending publish review.",
      cta: "Review now",
    },
    TRAINING_MANAGER: {
      heading: "Weekly focus",
      body: "Schedule two upcoming live sessions and update the curriculum for GIS 300.",
      cta: "Open schedule",
    },
    TRAINER: {
      heading: "Today's focus",
      body: "Review the 3 submitted practicals and respond to learner questions in GIS 200.",
      cta: "View submissions",
    },
    STUDENT: {
      heading: "Today's focus",
      body: "Finish one practical task and enter one Knowledge Hub challenge to keep your weekly pace strong.",
      cta: "View plan",
    },
    CORPORATE_CLIENT: {
      heading: "Team progress",
      body: "Your team has completed 62% of enrolled modules. 3 learners are behind schedule.",
      cta: "View team",
    },
    SCHOOL_COORDINATOR: {
      heading: "School update",
      body: "4 students have completed this week's assessment. Register your school for the Olympiad.",
      cta: "View students",
    },
    OLYMPIAD_COORDINATOR: {
      heading: "Olympiad status",
      body: "Registration closes in 3 days. 128 schools have signed up so far.",
      cta: "Manage event",
    },
  };

  return (
    map[role] ?? {
      heading: "Getting started",
      body: "Explore the platform and complete your profile to unlock all features.",
      cta: "View profile",
    }
  );
}
