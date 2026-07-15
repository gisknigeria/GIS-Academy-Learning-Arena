import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "../components/AppSidebar";
import { Topbar } from "../components/Topbar";
import { useTheme } from "../context/ThemeContext";
import type { PageId } from "../types/navigation";

const routeToPage: Record<string, PageId> = {
  "/dashboard": "dashboard",
  "/personalize": "knowledge",
  "/courses": "courses",
  "/learn": "learn",
  "/competitions": "arena",
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
  const { preferences } = useTheme();

  const activePage =
    (Object.entries(routeToPage).find(([path]) =>
      location.pathname === path || location.pathname.startsWith(path + "/"),
    )?.[1] as PageId) ?? "dashboard";

  const closeSidebar = () => setSidebarOpen(false);

  // Slugify the favourite for the data attribute (e.g. "Lionel Messi" → "lionel-messi")
  const favoriteSlug = preferences.favorite.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const categorySlug = preferences.fanCategory;

  return (
    <div
      className="app-shell"
      data-favorite-theme={favoriteSlug}
      data-learning-theme={categorySlug}
      data-learning-style={preferences.learningStyle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
    >
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
