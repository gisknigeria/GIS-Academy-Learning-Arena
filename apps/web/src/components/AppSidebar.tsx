import { ChevronRight, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";
import { navItems } from "../data/navigation";
import { getCoachPanel, getVisibleNavPages } from "../lib/roles";
import type { PageId } from "../types/navigation";

type AppSidebarProps = {
  activePage: PageId;
};

export function AppSidebar({ activePage }: AppSidebarProps) {
  const { user } = useAuth();
  const role = user?.role ?? "GUEST";
  const visiblePages = getVisibleNavPages(role);
  const coach = getCoachPanel(role);

  const visibleNavItems = navItems.filter((item) => visiblePages.has(item.id));

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <img src={logoMark} alt="" />
        </div>
        <div>
          <strong>GIS Konsult</strong>
          <span>Learning Arena</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={item.id === activePage ? "nav-item active" : "nav-item"}
              key={item.id}
              to={item.path}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <section className="coach-panel">
        <Sparkles size={20} />
        <h2>{coach.heading}</h2>
        <p>{coach.body}</p>
        <button>
          {coach.cta}
          <ChevronRight size={16} />
        </button>
      </section>
    </aside>
  );
}
