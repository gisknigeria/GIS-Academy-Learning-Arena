import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type TopbarProps = {
  onMenuClick: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { logout, user } = useAuth();

  const initials =
    user?.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "GA";

  const displayRole = user?.role
    ? user.role.replaceAll("_", " ")
    : "Member";

  return (
    <header className="topbar" role="banner">
      <button
        className="icon-button menu-button"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
        type="button"
      >
        <Menu size={21} aria-hidden="true" />
      </button>

      <div className="search" role="search">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Search courses, competitions, learners…"
          placeholder="Search…"
          type="search"
        />
      </div>

      <button className="icon-button" aria-label="Notifications" type="button">
        <Bell size={20} aria-hidden="true" />
      </button>

      {/* Profile link */}
      <Link
        to="/profile"
        className="profile topbar-profile-link"
        aria-label={`My profile — ${user?.fullName ?? "GIS User"}`}
      >
        <span aria-hidden="true">{initials}</span>
        <div>
          <strong>{user?.fullName ?? "GIS User"}</strong>
          <small>{displayRole}</small>
        </div>
      </Link>

      <button
        className="icon-button"
        aria-label="Log out"
        onClick={logout}
        type="button"
      >
        <LogOut size={19} aria-hidden="true" />
      </button>
    </header>
  );
}
