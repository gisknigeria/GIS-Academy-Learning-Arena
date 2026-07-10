import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Play,
  PlusCircle,
  RadioTower,
  Settings,
  Trophy,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleLabel, isAdminRole, isCoordinatorRole, isInstructorRole } from "../lib/roles";

// ─── Student / Alumni hero ────────────────────────────────────────────────────

function StudentHero({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Knowledge Hub</span>
        <h1>Welcome back, {name.split(" ")[0]}.</h1>
        <p>
          Pick up where you left off, complete your daily mission, and grow through personalised challenges.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/learn")}>
            <Play size={18} />
            Continue learning
          </button>
          <button className="secondary-button" onClick={() => navigate("/competitions")}>
            <Trophy size={18} />
            View challenges
          </button>
        </div>
      </div>
      <div className="arena-preview" aria-label="Live challenge status">
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

// ─── Guest hero ───────────────────────────────────────────────────────────────

function GuestHero({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Knowledge Hub</span>
        <h1>Welcome, {name.split(" ")[0]}.</h1>
        <p>
          Explore our GIS courses, join live competitions, and start building your geospatial skills today.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/courses")}>
            <BookOpen size={18} />
            Browse courses
          </button>
          <button className="secondary-button" onClick={() => navigate("/competitions")}>
            <Trophy size={18} />
            View challenges
          </button>
        </div>
      </div>
      <div className="arena-preview" aria-label="Live challenge status">
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

// ─── Trainer hero ─────────────────────────────────────────────────────────────
// Trainers: deliver content, grade submissions, manage assigned classes.
// They cannot create/publish courses — that's Admin / Training Manager territory.

function TrainerHero({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero hero-instructor">
      <div className="hero-copy">
        <span className="eyebrow">Trainer Dashboard</span>
        <h1>Good day, {name.split(" ")[0]}.</h1>
        <p>
          You have pending practicals to grade and learner questions awaiting a reply.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/assessments")}>
            <ClipboardCheck size={18} />
            Grade practicals
          </button>
          <button className="secondary-button" onClick={() => navigate("/classes")}>
            <CalendarDays size={18} />
            My classes
          </button>
        </div>
      </div>
      <div className="hero-stat-panel" aria-label="Trainer quick stats">
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

// ─── Examiner hero ────────────────────────────────────────────────────────────
// Examiners: set and grade assessments, view class rosters.

function ExaminerHero({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero hero-instructor">
      <div className="hero-copy">
        <span className="eyebrow">Examiner Dashboard</span>
        <h1>Good day, {name.split(" ")[0]}.</h1>
        <p>
          Review pending assessments, grade attempts, and manage your examination schedule.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/assessments")}>
            <ClipboardList size={18} />
            Assessments
          </button>
          <button className="secondary-button" onClick={() => navigate("/classes")}>
            <Users size={18} />
            Class roster
          </button>
        </div>
      </div>
      <div className="hero-stat-panel" aria-label="Examiner quick stats">
        <div className="hero-stat">
          <strong>8</strong>
          <span>Assessments</span>
        </div>
        <div className="hero-stat">
          <strong>3</strong>
          <span>Pending grading</span>
        </div>
        <div className="hero-stat">
          <strong>124</strong>
          <span>Total attempts</span>
        </div>
        <div className="hero-stat">
          <strong>68%</strong>
          <span>Pass rate</span>
        </div>
      </div>
    </section>
  );
}

// ─── Super Admin hero ─────────────────────────────────────────────────────────
// Full platform control: users, courses, payments, reports, challenges.

function SuperAdminHero({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero hero-admin">
      <div className="hero-copy">
        <span className="eyebrow">Super Admin — Platform Control</span>
        <h1>Platform overview</h1>
        <p>
          Manage users, courses, payments and platform settings from one place.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/users")}>
            <Users size={18} />
            Manage users
          </button>
          <button className="secondary-button" onClick={() => navigate("/reports")}>
            <BarChart3 size={18} />
            View reports
          </button>
        </div>
      </div>
      <div className="hero-admin-grid" aria-label="Admin quick actions">
        <button className="admin-action-card" onClick={() => navigate("/courses")}>
          <PlusCircle size={20} />
          <span>New course</span>
        </button>
        <button className="admin-action-card" onClick={() => navigate("/users")}>
          <UserCheck size={20} />
          <span>Approvals</span>
          <em className="badge">5</em>
        </button>
        <button className="admin-action-card" onClick={() => navigate("/reports")}>
          <BarChart3 size={20} />
          <span>Reports</span>
        </button>
        <button className="admin-action-card" onClick={() => navigate("/competitions")}>
          <RadioTower size={20} />
          <span>Live challenges</span>
        </button>
      </div>
    </section>
  );
}

// ─── Admin hero ───────────────────────────────────────────────────────────────
// Admin: manage learners, courses, classes, assessments. Cannot change platform settings.

function AdminHero({ name, role }: { name: string; role: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero hero-admin">
      <div className="hero-copy">
        <span className="eyebrow">{role} — Management Console</span>
        <h1>Good day, {name.split(" ")[0]}.</h1>
        <p>
          Manage learners, published courses, and assessments awaiting grading.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/users")}>
            <Users size={18} />
            View learners
          </button>
          <button className="secondary-button" onClick={() => navigate("/classes")}>
            <CalendarDays size={18} />
            Classes
          </button>
        </div>
      </div>
      <div className="hero-admin-grid" aria-label="Admin quick actions">
        <button className="admin-action-card" onClick={() => navigate("/users")}>
          <UserCheck size={20} />
          <span>Approvals</span>
        </button>
        <button className="admin-action-card" onClick={() => navigate("/courses")}>
          <BookOpen size={20} />
          <span>Courses</span>
        </button>
        <button className="admin-action-card" onClick={() => navigate("/reports")}>
          <BarChart3 size={20} />
          <span>Reports</span>
        </button>
        <button className="admin-action-card" onClick={() => navigate("/classes")}>
          <CalendarDays size={20} />
          <span>Schedule</span>
        </button>
      </div>
    </section>
  );
}

// ─── Training Manager hero ────────────────────────────────────────────────────
// Training Manager: curriculum planning, class scheduling, trainer assignment, reports.
// Cannot approve users or change platform settings.

function TrainingManagerHero({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero hero-admin">
      <div className="hero-copy">
        <span className="eyebrow">Training Manager — Program Console</span>
        <h1>Good day, {name.split(" ")[0]}.</h1>
        <p>
          Plan curricula, schedule live sessions, assign trainers, and track cohort performance.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/classes")}>
            <CalendarDays size={18} />
            Manage classes
          </button>
          <button className="secondary-button" onClick={() => navigate("/reports")}>
            <BarChart3 size={18} />
            Cohort reports
          </button>
        </div>
      </div>
      <div className="hero-admin-grid" aria-label="Training manager quick actions">
        <button className="admin-action-card" onClick={() => navigate("/classes")}>
          <CalendarDays size={20} />
          <span>Schedule</span>
        </button>
        <button className="admin-action-card" onClick={() => navigate("/courses")}>
          <BookOpen size={20} />
          <span>Curriculum</span>
        </button>
        <button className="admin-action-card" onClick={() => navigate("/assessments")}>
          <ClipboardList size={20} />
          <span>Assessments</span>
        </button>
        <button className="admin-action-card" onClick={() => navigate("/reports")}>
          <BarChart3 size={20} />
          <span>Reports</span>
        </button>
      </div>
    </section>
  );
}

// ─── School / Corporate Coordinator hero ──────────────────────────────────────
// Coordinators: enroll learners, track their group's progress, download certificates.

function CoordinatorHero({ name, role }: { name: string; role: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero hero-coordinator">
      <div className="hero-copy">
        <span className="eyebrow">{role}</span>
        <h1>Welcome, {name.split(" ")[0]}.</h1>
        <p>
          Monitor your group's learning progress, manage enrollments, and stay on top of upcoming classes.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/classes")}>
            <Users size={18} />
            My group
          </button>
          <button className="secondary-button" onClick={() => navigate("/reports")}>
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
// Olympiad Coordinator: manage brackets, assign judges, run live competitions.

function OlympiadHero({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero hero-arena">
      <div className="hero-copy">
        <span className="eyebrow">Olympiad Coordination Center</span>
        <h1>National GIS Olympiad</h1>
        <p>
          128 schools · 2,840 participants · Registration closes in 3 days.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/competitions")}>
            <Trophy size={18} />
            Manage brackets
          </button>
          <button className="secondary-button" onClick={() => navigate("/competitions")}>
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

// ─── Judge hero ───────────────────────────────────────────────────────────────
// Judges: view and score live Knowledge Hub competitions only.

function JudgeHero({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <section className="hero hero-arena">
      <div className="hero-copy">
        <span className="eyebrow">Judge Panel</span>
        <h1>Welcome, {name.split(" ")[0]}.</h1>
        <p>
          Review live competition entries, monitor scores, and submit your adjudication.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate("/competitions")}>
            <RadioTower size={18} />
            Live challenges
          </button>
          <button className="secondary-button" onClick={() => navigate("/reports")}>
            <BarChart3 size={18} />
            Score reports
          </button>
        </div>
      </div>
      <div className="arena-preview" aria-label="Live competition status">
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
  if (role === "TRAINING_MANAGER") return <TrainingManagerHero name={name} />;
  if (isAdminRole(role)) return <AdminHero name={name} role={roleLabel} />;
  if (role === "OLYMPIAD_COORDINATOR") return <OlympiadHero name={name} />;
  if (role === "JUDGE") return <JudgeHero name={name} />;
  if (isCoordinatorRole(role)) return <CoordinatorHero name={name} role={roleLabel} />;
  if (role === "EXAMINER") return <ExaminerHero name={name} />;
  if (isInstructorRole(role)) return <TrainerHero name={name} />;
  if (role === "GUEST") return <GuestHero name={name} />;

  // STUDENT, ALUMNI
  return <StudentHero name={name} />;
}
