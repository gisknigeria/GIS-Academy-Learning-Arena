import { ChevronRight, Sparkles, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";
import { navItems } from "../data/navigation";
import { getCoachPanel, getVisibleNavPages } from "../lib/roles";
import type { PageId } from "../types/navigation";

type AppSidebarProps = {
  activePage: PageId;
  /** Whether the sidebar is open on mobile */
  isOpen: boolean;
  /** Callback to close the sidebar (mobile) */
  onClose: () => void;
};

export function AppSidebar({ activePage, isOpen, onClose }: AppSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? "GUEST";
  const visiblePages = getVisibleNavPages(role);
  const coach = getCoachPanel(role);

  const visibleNavItems = navItems.filter((item) => visiblePages.has(item.id));

  function handleCoachCta() {
    // Navigate to the most relevant page based on role
    if (role === "STUDENT" || role === "ALUMNI") {
      navigate("/learn");
    } else if (role === "TRAINER" || role === "EXAMINER") {
      navigate("/assessments");
    } else {
      navigate("/courses");
    }
    onClose();
  }

  return (
    <aside className={`sidebar${isOpen ? " sidebar--open" : ""}`}>
      {/* Brand header */}
      <div className="brand">
        <div className="brand-mark">
          <img src={logoMark} alt="Knowledge Hub logo" />
        </div>
        <div>
          <strong>Knowledge Hub</strong>
          <span>Personalised Learning</span>
        </div>

        {/* Close button — visible on mobile only */}
        <button
          className="sidebar-close-btn icon-button"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="nav-list" aria-label="Primary navigation">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                isActive || item.id === activePage ? "nav-item active" : "nav-item"
              }
              key={item.id}
              to={item.path}
              onClick={onClose}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Coach panel */}
      <section className="coach-panel" aria-label="Quick tip">
        <Sparkles size={20} aria-hidden="true" />
        <h2>{coach.heading}</h2>
        <p>{coach.body}</p>
        <button type="button" onClick={handleCoachCta}>
          {coach.cta}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </section>
    </aside>
  );
}
