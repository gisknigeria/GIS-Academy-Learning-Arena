import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "../components/AppSidebar";
import { Topbar } from "../components/Topbar";
import type { PageId } from "../types/navigation";

const routeToPage: Record<string, PageId> = {
  "/dashboard": "dashboard",
  "/learn": "learn",
  "/arena": "arena",
  "/classes": "classes",
  "/assessments": "assessments",
  "/certificates": "certificates",
  "/reports": "reports",
};

export function DashboardLayout() {
  const location = useLocation();
  const activePage = routeToPage[location.pathname] ?? "dashboard";

  return (
    <main className="app-shell">
      <AppSidebar activePage={activePage} />
      <section className="main-panel">
        <Topbar />
        <Outlet />
      </section>
    </main>
  );
}
