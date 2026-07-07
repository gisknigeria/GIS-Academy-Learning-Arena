import { Bell, Command, LogOut, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleLabel } from "../lib/roles";

type TopbarProps = {
  onMenuClick: () => void;
};

// Detect OS for keyboard shortcut hint
const isMac =
  typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

export function Topbar({ onMenuClick }: TopbarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const initials =
    user?.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() ?? "GA";

  const roleLabel = user?.role
    ? getRoleLabel(user.role)
    : "Member";

  // Sticky shadow on scroll
  useEffect(() => {
    const panel = document.querySelector(".main-panel");
    if (!panel) return;
    const onScroll = () => setScrolled(panel.scrollTop > 8);
    panel.addEventListener("scroll", onScroll, { passive: true });
    return () => panel.removeEventListener("scroll", onScroll);
  }, []);

  // ⌘K / Ctrl+K to focus search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    navigate(`/courses?search=${encodeURIComponent(q)}`);
    setSearchValue("");
    searchRef.current?.blur();
  }

  return (
    <header
      className={`topbar${scrolled ? " topbar--scrolled" : ""}`}
      role="banner"
    >
      {/* Mobile hamburger */}
      <button
        className="icon-button menu-button"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
        type="button"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Search */}
      <form
        className="topbar-search"
        role="search"
        onSubmit={handleSearch}
        aria-label="Search"
      >
        <div className="topbar-search-input">
          <Search size={16} aria-hidden="true" color="var(--gray-400)" />
          <input
            ref={searchRef}
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search courses, competitions…"
            aria-label="Search courses, competitions, learners"
          />
          <div className="topbar-search-hint" aria-hidden="true">
            {isMac ? (
              <kbd className="topbar-search-kbd">
                <Command size={10} />
              </kbd>
            ) : (
              <kbd className="topbar-search-kbd">Ctrl</kbd>
            )}
            <kbd className="topbar-search-kbd">K</kbd>
          </div>
        </div>
      </form>

      {/* Right actions */}
      <div className="topbar-right">
        {/* Notifications */}
        <div className="topbar-notif">
          <button
            className="icon-button"
            aria-label="Notifications"
            type="button"
          >
            <Bell size={18} aria-hidden="true" />
          </button>
          {/* Red badge dot — show when there are unread notifications */}
          <span className="topbar-notif-badge" aria-hidden="true" />
        </div>

        {/* Profile chip */}
        <Link
          to="/profile"
          className="topbar-profile"
          aria-label={`My profile — ${user?.fullName ?? "GIS User"}`}
        >
          <div className="topbar-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="topbar-profile-info">
            <span className="topbar-profile-name">
              {user?.fullName ?? "GIS User"}
            </span>
            <span className="topbar-profile-role">{roleLabel}</span>
          </div>
        </Link>

        {/* Log out */}
        <button
          className="icon-button"
          aria-label="Log out"
          onClick={logout}
          type="button"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
