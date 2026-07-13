import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLoading } from "./PageLoading";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoading label="Preparing Knowledge Hub..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user && user.status !== "ACTIVE") {
    const isPending = user.status === "PENDING";

    return (
      <main className="account-status-page">
        <section className="account-status-panel">
          <span className="eyebrow">{isPending ? "Approval pending" : "Account unavailable"}</span>
          <h1>{isPending ? "Your trainer account is waiting for approval." : "Your account is currently suspended."}</h1>
          <p>
            {isPending
              ? "A Knowledge Hub admin or training manager needs to activate your account before you can access the trainer dashboard."
              : "Please contact the Knowledge Hub admin team to restore access."}
          </p>
          <button className="secondary-button" type="button" onClick={logout}>
            Log out
          </button>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
