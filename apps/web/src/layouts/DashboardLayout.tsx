import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "../components/AppSidebar";
import { Topbar } from "../components/Topbar";
import type { PageId } from "../types/navigation";

const routeToPage: Record<string, PageId> = {
  "/dashboard": "dashboard",
  "/courses": "courses",
  "/learn": "learn",
  "/arena": "arena",
  "/classes": "classes",
  "/assessments": "assessments",
  "/certificates": "certificates",
  "/reports": "reports",
  "/users": "users",
};

export function DashboardLayout() {
  const location = useLocation();
  // Match prefix so /assessments/xxx/build etc. all highlight "assessments"
  const activePage =
    (Object.entries(routeToPage).find(([path]) =>
      location.pathname === path || location.pathname.startsWith(path + "/"),
    )?.[1] as PageId) ?? "dashboard";

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
