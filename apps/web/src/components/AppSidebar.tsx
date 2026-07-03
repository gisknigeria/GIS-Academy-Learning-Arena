import { ChevronRight, Layers3, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { navItems } from "../data/navigation";
import type { PageId } from "../types/navigation";

type AppSidebarProps = {
  activePage: PageId;
};

export function AppSidebar({ activePage }: AppSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Layers3 size={22} />
        </div>
        <div>
          <strong>GIS Academy</strong>
          <span>Learning Arena</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary">
        {navItems.map((item) => {
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
        <h2>Today's focus</h2>
        <p>Finish one practical task and enter one arena challenge to keep your weekly pace strong.</p>
        <button>
          View plan
          <ChevronRight size={16} />
        </button>
      </section>
    </aside>
  );
}
