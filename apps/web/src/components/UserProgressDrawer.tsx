import { BookOpen, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usersApi, type AdminUser, type UserProgressResponse } from "../lib/users-api";

type Props = {
  user: AdminUser;
  onClose: () => void;
};

export function UserProgressDrawer({ user, onClose }: Props) {
  const { token } = useAuth();
  const [progress, setProgress] = useState<UserProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await usersApi.getProgress(token, user.id);
      setProgress(data);
    } catch {
      setError("Could not load progress data.");
    } finally {
      setLoading(false);
    }
  }, [token, user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />

      <aside className="progress-drawer" role="dialog" aria-modal="true" aria-label="User progress">
        <div className="drawer-header">
          <div>
            <h2>{user.fullName}</h2>
            <span className="drawer-email">{user.email}</span>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="inline-loader" style={{ padding: "24px 0" }}>
            <Loader2 size={18} className="spin" />
            Loading progress…
          </div>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : progress ? (
          <div className="drawer-body">
            <div className="drawer-stats-row">
              <div className="drawer-stat">
                <strong>{progress.enrollments.length}</strong>
                <span>Courses enrolled</span>
              </div>
              <div className="drawer-stat">
                <strong>{progress.totalCompleted}</strong>
                <span>Lessons completed</span>
              </div>
            </div>

            {progress.enrollments.length === 0 ? (
              <div className="drawer-empty">
                <BookOpen size={32} />
                <p>No course enrollments yet.</p>
              </div>
            ) : (
              <div className="drawer-enrollments">
                <h3>Course progress</h3>
                {progress.enrollments.map((e) => (
                  <div key={e.courseId} className="drawer-enrollment-item">
                    <div className="drawer-enrollment-header">
                      <span className="course-code">{e.code}</span>
                      <strong>{e.progress}%</strong>
                    </div>
                    <p className="drawer-course-title">{e.title}</p>
                    <div className="progress-track">
                      <div style={{ width: `${e.progress}%` }} />
                    </div>
                    <span className="drawer-enrolled-date">
                      Enrolled {new Date(e.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </aside>
    </>
  );
}
