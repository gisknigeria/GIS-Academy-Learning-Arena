import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getVisibleNavPages } from "../lib/roles";
import type { PageId } from "../types/navigation";

type RoleRouteProps = {
  page: PageId;
};

export function RoleRoute({ page }: RoleRouteProps) {
  const { user } = useAuth();
  const visiblePages = getVisibleNavPages(user?.role ?? "GUEST");

  if (!visiblePages.has(page)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
