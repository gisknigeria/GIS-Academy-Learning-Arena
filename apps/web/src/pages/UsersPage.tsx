import { BarChart2, Loader2, Search, UserCog } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SectionHeading } from "../components/SectionHeading";
import { UserProgressDrawer } from "../components/UserProgressDrawer";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../lib/roles";
import { usersApi, type AdminUser, type UserStatus } from "../lib/users-api";
import type { PaymentStatus, UserRole } from "../types/auth";

// ─── Label maps ──────────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  NOT_REQUIRED: "Not required",
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
  BLOCKED: "Blocked",
};

const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  SUSPENDED: "Suspended",
};

const PAYMENT_STATUS_COLOURS: Record<PaymentStatus, string> = {
  NOT_REQUIRED: "badge-neutral",
  PENDING: "badge-warning",
  PAID: "badge-success",
  OVERDUE: "badge-danger",
  BLOCKED: "badge-danger",
};

const USER_STATUS_COLOURS: Record<UserStatus, string> = {
  ACTIVE: "badge-success",
  PENDING: "badge-warning",
  SUSPENDED: "badge-danger",
};

const ALL_ROLES: UserRole[] = [
  "SUPER_ADMIN", "ADMIN", "TRAINING_MANAGER", "TRAINER",
  "STUDENT", "CORPORATE_CLIENT", "SCHOOL_COORDINATOR",
  "OLYMPIAD_COORDINATOR", "EXAMINER", "JUDGE", "GUEST", "ALUMNI",
];

const ALL_PAYMENT_STATUSES: PaymentStatus[] = [
  "NOT_REQUIRED", "PENDING", "PAID", "OVERDUE", "BLOCKED",
];

const ALL_USER_STATUSES: UserStatus[] = ["ACTIVE", "PENDING", "SUSPENDED"];

// ─── Component ───────────────────────────────────────────────────────────────

export function UsersPage() {
  const { token, user: currentUser } = useAuth();

  // List state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "">("");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "">("");
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | "">("");

  // Update state — tracks which cell is saving
  const [saving, setSaving] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");

  // Progress drawer
  const [drawerUser, setDrawerUser] = useState<AdminUser | null>(null);

  // Debounce search input
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (p = 1) => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const result = await usersApi.list(token, {
          search: search || undefined,
          role: (filterRole as UserRole) || undefined,
          status: (filterStatus as UserStatus) || undefined,
          paymentStatus: (filterPayment as PaymentStatus) || undefined,
          page: p,
          limit: 30,
        });
        setUsers(result.data);
        setTotal(result.meta.total);
        setPage(result.meta.page);
        setTotalPages(result.meta.totalPages);
      } catch {
        setError("Could not load users. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [token, search, filterRole, filterStatus, filterPayment],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void load(1), 350);
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    if (!token) return;
    setSaving(`${userId}-role`);
    setUpdateError("");
    try {
      const updated = await usersApi.updateRole(token, userId, role);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setSaving(null);
    }
  }

  async function handlePaymentChange(userId: string, paymentStatus: PaymentStatus) {
    if (!token) return;
    setSaving(`${userId}-payment`);
    setUpdateError("");
    try {
      const updated = await usersApi.updatePaymentStatus(token, userId, paymentStatus);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update payment status.");
    } finally {
      setSaving(null);
    }
  }

  async function handleStatusChange(userId: string, status: UserStatus) {
    if (!token) return;
    setSaving(`${userId}-status`);
    setUpdateError("");
    try {
      const updated = await usersApi.updateStatus(token, userId, status);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setSaving(null);
    }
  }

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  return (
    <section className="module-page">
      <SectionHeading
        eyebrow="Administration"
        title="User management"
        action={
          <span className="users-total-badge">
            {total} user{total !== 1 ? "s" : ""}
          </span>
        }
      />

      {/* ── Filters ── */}
      <div className="users-filter-bar">
        <div className="users-search-wrap">
          <Search size={15} />
          <input
            className="users-search"
            placeholder="Search name, email or phone…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <select
          className="users-filter-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as UserRole | "")}
        >
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>

        <select
          className="users-filter-select"
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value as PaymentStatus | "")}
        >
          <option value="">All payment statuses</option>
          {ALL_PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          className="users-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as UserStatus | "")}
        >
          <option value="">All statuses</option>
          {ALL_USER_STATUSES.map((s) => (
            <option key={s} value={s}>{USER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {updateError ? <p className="form-error" style={{ marginBottom: 8 }}>{updateError}</p> : null}

      {/* ── Table ── */}
      {loading ? (
        <div className="page-loading">
          <Loader2 size={22} className="spin" />
          Loading users…
        </div>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <UserCog size={40} />
          <strong>No users found</strong>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Courses</th>
                <th>Joined</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isTargetSuperAdmin = u.role === "SUPER_ADMIN";
                // ADMIN cannot touch a SUPER_ADMIN row; also can't set SUPER_ADMIN role
                const canEditRoles = isSuperAdmin || (!isTargetSuperAdmin && !isSelf);
                const canEditStatus = !isSelf;

                return (
                  <tr key={u.id} className={u.status === "SUSPENDED" ? "row-suspended" : ""}>
                    {/* User */}
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" aria-hidden="true">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{u.fullName}</strong>
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      {saving === `${u.id}-role` ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <select
                          className="inline-select"
                          value={u.role}
                          disabled={!canEditRoles}
                          onChange={(e) =>
                            void handleRoleChange(u.id, e.target.value as UserRole)
                          }
                        >
                          {ALL_ROLES.map((r) => (
                            // Non-super-admins can't assign SUPER_ADMIN
                            (!isSuperAdmin && r === "SUPER_ADMIN") ? null : (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            )
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Payment status */}
                    <td>
                      {saving === `${u.id}-payment` ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <select
                          className={`inline-select payment-select ${PAYMENT_STATUS_COLOURS[u.paymentStatus]}`}
                          value={u.paymentStatus}
                          onChange={(e) =>
                            void handlePaymentChange(u.id, e.target.value as PaymentStatus)
                          }
                        >
                          {ALL_PAYMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Account status */}
                    <td>
                      {saving === `${u.id}-status` ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <select
                          className={`inline-select status-select ${USER_STATUS_COLOURS[u.status]}`}
                          value={u.status}
                          disabled={!canEditStatus}
                          onChange={(e) =>
                            void handleStatusChange(u.id, e.target.value as UserStatus)
                          }
                        >
                          {ALL_USER_STATUSES.map((s) => (
                            <option key={s} value={s}>{USER_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Enrollments count */}
                    <td>
                      <span className="users-count-badge">
                        {u._count.enrollments}
                      </span>
                    </td>

                    {/* Joined date */}
                    <td className="users-date-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Progress drawer trigger */}
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`View ${u.fullName}'s progress`}
                        title="View progress"
                        onClick={() => setDrawerUser(u)}
                      >
                        <BarChart2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 ? (
        <div className="pagination-row">
          <button
            className="secondary-button small-button"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1)}
          >
            Previous
          </button>
          <span className="pagination-label">
            Page {page} of {totalPages}
          </span>
          <button
            className="secondary-button small-button"
            disabled={page >= totalPages || loading}
            onClick={() => void load(page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}

      {/* ── Progress drawer ── */}
      {drawerUser ? (
        <UserProgressDrawer
          user={drawerUser}
          onClose={() => setDrawerUser(null)}
        />
      ) : null}
    </section>
  );
}
