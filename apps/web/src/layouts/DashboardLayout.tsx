import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "../components/AppSidebar";
import { Topbar } from "../components/Topbar";
import type { PageId } from "../types/navigation";

const SIDEBAR_COLLAPSED_KEY = "gis_sidebar_collapsed";

const routeToPage: Record<string, PageId> = {
  "/dashboard":   "dashboard",
  "/courses":     "courses",
  "/learn":       "learn",
  "/arena":       "arena",
  "/classes":     "classes",
  "/assessments": "assessments",
  "/certificates":"certificates",
  "/reports":     "reports",
  "/users":       "users",
};

export function DashboardLayout() {
  const location = useLocation();

  // Mobile sidebar open/close
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop sidebar collapsed — persisted in localStorage
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true",
  );

  const activePage =
    (Object.entries(routeToPage).find(([path]) =>
      location.pathname === path ||
      location.pathname.startsWith(path + "/"),
    )?.[1] as PageId) ?? "dashboard";

  const closeSidebar = () => setSidebarOpen(false);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <div
      className={`app-shell${collapsed ? " app-shell--collapsed" : ""}`}
    >
      {/* Ambient floating tokens */}
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
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      <main className="main-panel">
        <Topbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <div className="main-panel-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
