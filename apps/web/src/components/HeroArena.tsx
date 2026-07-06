import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Play,
  PlusCircle,
  RadioTower,
  Settings,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRoleLabel, isAdminRole, isCoordinatorRole, isInstructorRole } from "../lib/roles";

// ─── Student / Alumni / Guest hero ───────────────────────────────────────────

function StudentHero({ name }: { name: string }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">GIS Konsult Learning Arena</span>
        <h1>Welcome back, {name.split(" ")[0]}.</h1>
        <p>
          Pick up where you left off, complete your daily mission, and climb the national arena.
        </p>
        <div className="hero-actions">
          <button className="primary-button">
            <Play size={18} />
            Continue learning
          </button>
          <button className="secondary-button">
            <Trophy size={18} />
            Enter arena
          </button>
        </div>
      </div>
      <div className="arena-preview" aria-label="Live arena status">
        <div className="pulse-row">
          <span className="live-dot" />
          Live challenge
        </div>
        <h2>Location Intelligence Sprint</h2>
        <div className="timer">07:42</div>
        <div className="duel">
          <span>Team Oyo</span>
          <strong>840</strong>
          <em>vs</em>
          <strong>790</strong>
          <span>Team Lagos</span>
        </div>
      </div>
    </section>
  );
}

// ─── Trainer / Examiner hero ──────────────────────────────────────────────────

function TrainerHero({ name }: { name: string }) {
  return (
    <section className="hero hero-instructor">
      <div className="hero-copy">
        <span className="eyebrow">Instructor Dashboard</span>
        <h1>Good day, {name.split(" ")[0]}.</h1>
        <p>
          You have 11 practicals to grade and 4 learner questions awaiting a reply.
        </p>
        <div className="hero-actions">
          <button className="primary-button">
            <BookOpen size={18} />
            My classes
          </button>
          <button className="secondary-button">
            <CalendarDays size={18} />
            Schedule
          </button>
        </div>
      </div>
      <div className="hero-stat-panel" aria-label="Instructor quick stats">
        <div className="hero-stat">
          <strong>96</strong>
          <span>Students</span>
        </div>
        <div className="hero-stat">
          <strong>4</strong>
          <span>Active classes</span>
        </div>
        <div className="hero-stat">
          <strong>11</strong>
          <span>Pending reviews</span>
        </div>
        <div className="hero-stat">
          <strong>71%</strong>
          <span>Avg score</span>
        </div>
      </div>
    </section>
  );
}

// ─── Super Admin hero ─────────────────────────────────────────────────────────

function SuperAdminHero({ name }: { name: string }) {
  return (
    <section className="hero hero-admin">
      <div className="hero-copy">
        <span className="eyebrow">Super Admin — Platform Control</span>
        <h1>Platform overview</h1>
        <p>
          1,284 users · 34 active courses · ₦2.4M in pending payments. All systems operational.
        </p>
        <div className="hero-actions">
          <button className="primary-button">
            <Users size={18} />
            Manage users
          </button>
          <button className="secondary-button">
            <Settings size={18} />
            Platform settings
          </button>
        </div>
      </div>
      <div className="hero-admin-grid" aria-label="Admin quick actions">
        <button className="admin-action-card">
          <PlusCircle size={20} />
          <span>New course</span>
        </button>
        <button className="admin-action-card">
          <UserCheck size={20} />
          <span>Approvals</span>
          <em className="badge">5</em>
        </button>
        <button className="admin-action-card">
          <BarChart3 size={20} />
          <span>Reports</span>
        </button>
        <button className="admin-action-card">
          <RadioTower size={20} />
          <span>Live arena</span>
        </button>
      </div>
    </section>
  );
}

// ─── Admin / Training Manager hero ───────────────────────────────────────────

function AdminHero({ name, role }: { name: string; role: string }) {
  return (
    <section className="hero hero-admin">
      <div className="hero-copy">
        <span className="eyebrow">{role} — Management Console</span>
        <h1>Good day, {name.split(" ")[0]}.</h1>
        <p>
          842 active learners across 28 published courses. 14 assessments awaiting grading.
        </p>
        <div className="hero-actions">
          <button className="primary-button">
            <Users size={18} />
            View learners
          </button>
          <button className="secondary-button">
            <CalendarDays size={18} />
            Classes
          </button>
        </div>
      </div>
      <div className="hero-admin-grid" aria-label="Admin quick actions">
        <button className="admin-action-card">
          <UserCheck size={20} />
          <span>Approvals</span>
        </button>
        <button className="admin-action-card">
          <BookOpen size={20} />
          <span>Courses</span>
        </button>
        <button className="admin-action-card">
          <BarChart3 size={20} />
          <span>Reports</span>
        </button>
        <button className="admin-action-card">
          <CalendarDays size={20} />
          <span>Schedule</span>
        </button>
      </div>
    </section>
  );
}

// ─── Coordinator hero (School / Corporate / Olympiad) ────────────────────────

function CoordinatorHero({ name, role }: { name: string; role: string }) {
  return (
    <section className="hero hero-coordinator">
      <div className="hero-copy">
        <span className="eyebrow">{role}</span>
        <h1>Welcome, {name.split(" ")[0]}.</h1>
        <p>
          Monitor your group's learning progress, manage enrollments, and stay on top of upcoming classes.
        </p>
        <div className="hero-actions">
          <button className="primary-button">
            <Users size={18} />
            My group
          </button>
          <button className="secondary-button">
            <BarChart3 size={18} />
            Progress report
          </button>
        </div>
      </div>
      <div className="hero-stat-panel" aria-label="Group quick stats">
        <div className="hero-stat">
          <strong>56</strong>
          <span>Enrolled</span>
        </div>
        <div className="hero-stat">
          <strong>43</strong>
          <span>Active</span>
        </div>
        <div className="hero-stat">
          <strong>61%</strong>
          <span>Completion</span>
        </div>
        <div className="hero-stat">
          <strong>3</strong>
          <span>Classes soon</span>
        </div>
      </div>
    </section>
  );
}

// ─── Olympiad Coordinator hero ────────────────────────────────────────────────

function OlympiadHero({ name }: { name: string }) {
  return (
    <section className="hero hero-arena">
      <div className="hero-copy">
        <span className="eyebrow">Olympiad Coordination Center</span>
        <h1>National GIS Olympiad</h1>
        <p>
          128 schools · 2,840 participants · Registration closes in 3 days.
        </p>
        <div className="hero-actions">
          <button className="primary-button">
            <Trophy size={18} />
            Manage brackets
          </button>
          <button className="secondary-button">
            <RadioTower size={18} />
            Live challenges
          </button>
        </div>
      </div>
      <div className="arena-preview" aria-label="Live olympiad status">
        <div className="pulse-row">
          <span className="live-dot" />
          4 challenges live
        </div>
        <h2>School Speed Mapping</h2>
        <div className="timer">04:18</div>
        <div className="duel">
          <span>Kaduna</span>
          <strong>18,920</strong>
          <em>vs</em>
          <strong>18,310</strong>
          <span>Oyo</span>
        </div>
      </div>
    </section>
  );
}

// ─── Root switcher ────────────────────────────────────────────────────────────

export function HeroArena() {
  const { user } = useAuth();
  const name = user?.fullName ?? "there";
  const role = user?.role ?? "GUEST";
  const roleLabel = getRoleLabel(role);

  if (role === "SUPER_ADMIN") return <SuperAdminHero name={name} />;
  if (isAdminRole(role)) return <AdminHero name={name} role={roleLabel} />;
  if (role === "OLYMPIAD_COORDINATOR" || role === "JUDGE")
    return <OlympiadHero name={name} />;
  if (isCoordinatorRole(role)) return <CoordinatorHero name={name} role={roleLabel} />;
  if (isInstructorRole(role)) return <TrainerHero name={name} />;

  // STUDENT, ALUMNI, GUEST
  return <StudentHero name={name} />;
}
