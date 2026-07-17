import {
  Archive,
  ArrowRight,
  BookOpen,
  Filter,
  Loader2,
  PlusCircle,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CreateCourseModal } from "../components/CreateCourseModal";
import { PaymentGate } from "../components/PaymentGate";
import { PaymentStatusBanner } from "../components/PaymentStatusBanner";
import { ProgrammeCatalogue } from "../components/ProgrammeCatalogue";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { getCourseAccessLevelLabel, loadKnowledgeHubPreferences, trainingCategories } from "../data/knowledgeHub";
import { coursesApi } from "../lib/courses-api";
import { profileApi } from "../lib/profile-api";
import { getCourseAccess } from "../lib/use-payment-access";
import { isAdminRole } from "../lib/roles";
import type { PaymentStatus, UserRole } from "../types/auth";
import type { Course } from "../types/course";
import { DELIVERY_MODE_LABELS } from "../types/course";

const TRAINING_CATEGORY_CARDS = [
  {
    title: "Bootcamp",
    body: "Short, practical and outcome-focused programmes.",
  },
  {
    title: "Green",
    body: "School pathways for technology, sustainability and geospatial skills.",
  },
  {
    title: "Academy",
    body: "Professional technical courses and certification.",
  },
  {
    title: "Industry Training",
    body: "Sector-focused workforce and operational training.",
  },
  {
    title: "Premium Executive Service",
    body: "Custom leadership, strategy and advisory programmes.",
  },
];

// ─── Delivery mode colour config ─────────────────────────────────────────────

const MODE_CONFIG: Record<
  Course["deliveryMode"],
  { badge: string; gradient: string; dot: string }
> = {
  E_LEARNING:   { badge: "badge-green",  gradient: "linear-gradient(135deg, #0c3326 0%, #146b4a 100%)", dot: "#1fa66a" },
  ONSITE:       { badge: "badge-blue",   gradient: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", dot: "#2563eb" },
  LIVE_VIRTUAL: { badge: "badge-orange", gradient: "linear-gradient(135deg, #7c2d12 0%, #e9812b 100%)", dot: "#e9812b" },
  HYBRID:       { badge: "badge-purple", gradient: "linear-gradient(135deg, #3b0764 0%, #7c3aed 100%)", dot: "#7c3aed" },
};

function DeliveryBadge({ mode }: { mode: Course["deliveryMode"] }) {
  return (
    <span className={`course-badge ${MODE_CONFIG[mode].badge}`}>
      {DELIVERY_MODE_LABELS[mode]}
    </span>
  );
}

function LevelTag({ course }: { course: Course }) {
  if (!course.level) return null;
  return <span className="course-level">{getCourseAccessLevelLabel(course.trainingCategory, course.level)}</span>;
}

// ─── Admin table row ──────────────────────────────────────────────────────────

function CourseRow({
  course,
  onArchive,
  onRestore,
  canArchive,
}: {
  course: Course;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  canArchive: boolean;
}) {
  return (
    <tr className={course.isArchived ? "row-archived" : ""}>
      <td>
        <span className="course-code">{course.code}</span>
      </td>
      <td>
        <Link className="course-title-link" to={`/courses/${course.id}`}>
          <strong>{course.title}</strong>
        </Link>
        {course.description && (
          <p className="table-sub">{course.description.slice(0, 80)}{course.description.length > 80 ? "…" : ""}</p>
        )}
      </td>
      <td>
        <LevelTag course={course} />
      </td>
      <td>
        <DeliveryBadge mode={course.deliveryMode} />
      </td>
      <td>
        <span className="badge-xs badge-green">{course.trainingCategory ?? "Academy"}</span>
      </td>
      <td className="cell-center">
        <span className="count-chip">
          <BookOpen size={13} />
          {course._count?.lessons ?? 0}
        </span>
      </td>
      <td className="cell-center">
        <span className="count-chip">
          <Users size={13} />
          {course._count?.enrollments ?? 0}
        </span>
      </td>
      <td className="cell-center">
        {course.requiresPayment ? (
          <span className="badge-orange badge-xs">Paid</span>
        ) : (
          <span className="badge-green badge-xs">Free</span>
        )}
      </td>
      <td className="cell-actions">
        {!canArchive ? (
          <Link className="secondary-button small-button" to={`/courses/${course.id}`}>Manage</Link>
        ) : course.isArchived ? (
          <button
            className="action-btn restore"
            onClick={() => onRestore(course.id)}
            title="Restore course"
            aria-label="Restore course"
          >
            <RotateCcw size={15} />
            Restore
          </button>
        ) : (
          <button
            className="action-btn archive"
            onClick={() => onArchive(course.id)}
            title="Archive course"
            aria-label="Archive course"
          >
            <Archive size={15} />
            Archive
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Student card — premium design ───────────────────────────────────────────

function CourseCard({
  course,
  role,
  paymentStatus,
}: {
  course: Course;
  role: UserRole;
  paymentStatus: PaymentStatus;
}) {
  const access = getCourseAccess(course, role, paymentStatus);
  const isLocked = !access.allowed;
  const cfg = MODE_CONFIG[course.deliveryMode];
  const lessonCount = course._count?.lessons ?? 0;
  const enrollCount = course._count?.enrollments ?? 0;

  return (
    <article className={`course-card-v2${isLocked ? " course-card-v2--locked" : ""}`}>

      {/* Coloured header band */}
      <div
        className="course-card-v2-header"
        style={{ background: isLocked ? "linear-gradient(135deg, #6b7280, #9ca3af)" : cfg.gradient }}
        aria-hidden="true"
      >
        {/* Grid pattern overlay */}
        <div className="course-card-v2-grid-overlay" />

        <div className="course-card-v2-header-content">
          {/* Level pill */}
          {course.level && (
            <span className="course-card-v2-level">{getCourseAccessLevelLabel(course.trainingCategory, course.level)}</span>
          )}

          {/* Lesson count in top-right */}
          <span className="course-card-v2-lesson-count">
            <BookOpen size={12} />
            {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Code centred */}
        <div className="course-card-v2-code">{course.code}</div>
      </div>

      {/* Body */}
      <div className="course-card-v2-body">
        {/* Mode + payment badges */}
        <div className="course-card-v2-badges">
          <DeliveryBadge mode={course.deliveryMode} />
          <span className="badge-green badge-xs">{course.trainingCategory ?? "Academy"}</span>
        </div>

        {/* Title */}
        <h3 className="course-card-v2-title">{course.title}</h3>

        {/* Description */}
        {course.description && (
          <p className={`course-card-v2-desc${isLocked ? " course-card-v2-desc--muted" : ""}`}>
            {course.description.length > 100
              ? `${course.description.slice(0, 100)}…`
              : course.description}
          </p>
        )}

        {/* Enrollment count */}
        <div className="course-card-v2-meta">
          <span className="course-card-v2-enrolled">
            <Users size={13} />
            {enrollCount.toLocaleString()} enrolled
          </span>
        </div>

        {/* CTA or payment gate */}
        <div className="course-card-v2-footer">
          {isLocked ? (
            <PaymentGate
              accessStatus={access as { allowed: false; reason: "payment_required" | "account_blocked" | "account_overdue" }}
              compact
            />
          ) : (
            <Link
              className="course-card-v2-cta"
              to={`/courses/${course.id}`}
              style={{ background: cfg.gradient }}
            >
              Open course
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CoursesPage() {
  const { user, token } = useAuth();
  const role = user?.role ?? "GUEST";
  const paymentStatus = user?.paymentStatus ?? "PENDING";
  const isAdmin = isAdminRole(role) || role === "TRAINER";

  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(() => {
    if (isAdminRole(role) || role === "TRAINER") return "";
    return loadKnowledgeHubPreferences().trainingCategory;
  });
  const effectiveCategoryFilter = !isAdmin ? (categoryFilter || loadKnowledgeHubPreferences().trainingCategory) : categoryFilter;
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (opts: { search?: string; mode?: string; category?: string; archived?: boolean; page?: number } = {}) => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const res = await coursesApi.list(token, {
          search: opts.search ?? search,
          deliveryMode: (opts.mode ?? modeFilter) || undefined,
          trainingCategory: (opts.category ?? effectiveCategoryFilter) || undefined,
          includeArchived: opts.archived ?? showArchived,
          page: opts.page ?? page,
          limit: 20,
        });
        setCourses(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } catch {
        setError("Could not load courses. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [token, search, modeFilter, categoryFilter, showArchived, page],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    async function loadProfileCategory() {
      if (!token || isAdmin) return;
      try {
        const fullUser = await profileApi.getMe(token);
        const profileCategory = fullUser.profile?.trainingCategory;
        if (profileCategory && profileCategory !== categoryFilter) {
          setCategoryFilter(profileCategory);
          setPage(1);
          void load({ category: profileCategory, page: 1 });
        }
      } catch {
        // The local onboarding preference already provides a fallback.
      }
    }

    void loadProfileCategory();
  }, [categoryFilter, isAdmin, load, token]);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      void load({ search: val, page: 1 });
    }, 350);
  }

  function handleModeChange(val: string) {
    setModeFilter(val);
    setPage(1);
    void load({ mode: val, page: 1 });
  }

  function handleCategoryChange(val: string) {
    if (!isAdmin) {
      const nextCategory = loadKnowledgeHubPreferences().trainingCategory || effectiveCategoryFilter;
      setCategoryFilter(nextCategory);
      setPage(1);
      void load({ category: nextCategory, page: 1 });
      return;
    }
    setCategoryFilter(val);
    setPage(1);
    void load({ category: val, page: 1 });
  }

  function handleArchivedToggle(val: boolean) {
    setShowArchived(val);
    setPage(1);
    void load({ archived: val, page: 1 });
  }

  async function handleArchive(id: string) {
    if (!token) return;
    await coursesApi.archive(token, id);
    void load();
  }

  async function handleRestore(id: string) {
    if (!token) return;
    await coursesApi.restore(token, id);
    void load();
  }

  function handleCreated(course: Course) {
    setShowModal(false);
    setCourses((prev) => [course, ...prev]);
    setTotal((t) => t + 1);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section className="module-page">
      {/* Payment status banner — students only */}
      {!isAdmin && <PaymentStatusBanner paymentStatus={paymentStatus} />}

      {/* Header */}
      <div className="page-header">
        <SectionHeading
          eyebrow={isAdmin ? "Course management" : "Learning catalogue"}
          title={isAdmin ? "All courses" : "Browse courses"}
        />
        <div className="page-header-actions">
          {isAdmin && (
            <button className="primary-button" onClick={() => setShowModal(true)}>
              <PlusCircle size={17} />
              New course
            </button>
          )}
        </div>
      </div>


      {/* Filters */}
      <div className="training-category-strip" aria-label="Training categories">
        {TRAINING_CATEGORY_CARDS.map((category) => (
          <article
            className={categoryFilter === category.title ? "active" : ""}
            key={category.title}
            onClick={() => {
              if (isAdmin) handleCategoryChange(category.title);
            }}
            role="button"
            tabIndex={0}
          >
            <strong>{category.title}</strong>
            <span>{category.body}</span>
          </article>
        ))}
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={16} />
          <input
            placeholder="Search by title, code, or description…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search courses"
          />
        </div>
        <div className="filter-select-wrap">
          <Filter size={15} />
          <select
            value={effectiveCategoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            aria-label="Filter by training category"
            disabled={!isAdmin}
          >
            {isAdmin ? <option value="">All categories</option> : null}
            {trainingCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="filter-select-wrap">
          <Filter size={15} />
          <select
            value={modeFilter}
            onChange={(e) => handleModeChange(e.target.value)}
            aria-label="Filter by delivery mode"
          >
            <option value="">All modes</option>
            <option value="E_LEARNING">E-Learning</option>
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        {isAdmin && (
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => handleArchivedToggle(e.target.checked)}
            />
            Show archived
          </label>
        )}
        <span className="filter-count">
          {loading ? "" : `${total} course${total !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Error */}
      {error && <p className="form-error">{error}</p>}

      {/* Loading */}
      {loading && (
        <div className="page-loading">
          <Loader2 size={22} className="spin" />
          Loading courses…
        </div>
      )}

      {/* Empty */}
      {!loading && courses.length === 0 && !error && (
        <div className="empty-state">
          <BookOpen size={40} />
          <strong>No courses found</strong>
          <p>{search ? "Try a different search term." : isAdmin ? "Create your first course to get started." : "No courses are available yet."}</p>
          {isAdmin && (
            <button className="primary-button" onClick={() => setShowModal(true)}>
              <PlusCircle size={17} />
              New course
            </button>
          )}
        </div>
      )}

      {/* Admin table */}
      {!loading && courses.length > 0 && isAdmin && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
              <th>Level</th>
              <th>Mode</th>
              <th>Category</th>
              <th className="cell-center">Lessons</th>
                <th className="cell-center">Enrolled</th>
                <th className="cell-center">Access</th>
                <th className="cell-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <CourseRow
                  key={c.id}
                  course={c}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  canArchive={isAdminRole(role)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student cards */}
      {!loading && courses.length > 0 && !isAdmin && (
        <div className="course-grid-v2">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} role={role} paymentStatus={paymentStatus} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button
            className="secondary-button"
            disabled={page <= 1}
            onClick={() => {
              const p = page - 1;
              setPage(p);
              void load({ page: p });
            }}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="secondary-button"
            disabled={page >= totalPages}
            onClick={() => {
              const p = page + 1;
              setPage(p);
              void load({ page: p });
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <CreateCourseModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </section>
  );
}
