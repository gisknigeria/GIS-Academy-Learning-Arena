import { useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Match prefix so /assessments/xxx/build etc. all highlight "assessments"
  const activePage =
    (Object.entries(routeToPage).find(([path]) =>
      location.pathname === path || location.pathname.startsWith(path + "/"),
    )?.[1] as PageId) ?? "dashboard";

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      <div className="ambient-game-bg" aria-hidden="true">
        <span className="ambient-token token-a" />
        <span className="ambient-token token-b" />
        <span className="ambient-token token-c" />
        <span className="ambient-token token-d" />
        <span className="ambient-token token-e" />
        <span className="ambient-token token-f" />
      </div>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          aria-hidden="true"
          onClick={closeSidebar}
        />
      )}

      <AppSidebar
        activePage={activePage}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <section className="main-panel">
        <Topbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <Outlet />
      </section>
    </div>
  );
}
