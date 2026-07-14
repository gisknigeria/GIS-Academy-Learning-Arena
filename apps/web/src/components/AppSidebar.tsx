import { X } from "lucide-react";
import { NavLink } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import { navItems } from "../data/navigation";
import { getVisibleNavPages } from "../lib/roles";
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
  const { t } = useLocalization();
  const role = user?.role ?? "GUEST";
  const visiblePages = getVisibleNavPages(role);

  const visibleNavItems = navItems.filter((item) => visiblePages.has(item.id));

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
              <span>{t(`nav.${item.id}` as Parameters<typeof t>[0], item.label)}</span>
            </NavLink>
          );
        })}
      </nav>

    </aside>
  );
}
