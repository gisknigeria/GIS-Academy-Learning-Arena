import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";
import { navItems } from "../data/navigation";
import { getCoachPanel, getVisibleNavPages } from "../lib/roles";
import type { PageId } from "../types/navigation";

type AppSidebarProps = {
  activePage: PageId;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function AppSidebar({
  activePage,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? "GUEST";
  const visiblePages = getVisibleNavPages(role);
  const coach = getCoachPanel(role);

  const visibleNavItems = navItems.filter((item) => visiblePages.has(item.id));

  function handleCoachCta() {
    if (role === "STUDENT" || role === "ALUMNI") navigate("/learn");
    else if (role === "TRAINER" || role === "EXAMINER") navigate("/assessments");
    else navigate("/courses");
    onClose();
  }

  const sidebarClass = [
    "sidebar",
    isOpen ? "sidebar--open" : "",
    collapsed ? "sidebar--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={sidebarClass} aria-label="Main navigation">
      {/* ── Brand header ── */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <img src={logoMark} alt="GIS Academy" />
        </div>

        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">GIS Academy</span>
          <span className="sidebar-brand-sub">Learning Arena</span>
        </div>

        {/* Desktop collapse toggle */}
        <button
          className="sidebar-collapse-btn"
          style={{ display: "grid" }}
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Mobile close button */}
        <button
          className="sidebar-close-btn"
          style={{ display: isOpen ? "grid" : "none" }}
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </div>

      {/* ── Scrollable inner ── */}
      <div className="sidebar-inner">
        {/* Section label */}
        {!collapsed && (
          <p className="nav-section-label">Menu</p>
        )}

        {/* Nav items */}
        <nav className="nav-list" aria-label="Primary navigation">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  isActive || item.id === activePage ? "nav-item active" : "nav-item"
                }
              >
                <Icon size={18} aria-hidden="true" />
                <span className="nav-item-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── Coach / tip panel ── */}
        <section className="coach-panel" aria-label="Quick tip">
          <div className="coach-panel-header">
            <div className="coach-panel-icon">
              <Sparkles size={14} aria-hidden="true" />
            </div>
            <h2>{coach.heading}</h2>
          </div>
          <p>{coach.body}</p>
          <button
            className="coach-panel-btn"
            type="button"
            onClick={handleCoachCta}
          >
            <span>{coach.cta}</span>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </section>
      </div>
    </aside>
  );
}
