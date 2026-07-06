import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Topbar() {
  const { logout, user } = useAuth();
  const initials = user?.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() ?? "GA";

  return (
    <header className="topbar">
      <button className="icon-button menu-button" aria-label="Open menu">
        <Menu size={21} />
      </button>
      <div className="search">
        <Search size={18} />
        <input aria-label="Search" placeholder="Search courses, competitions, learners..." />
      </div>
      <button className="icon-button" aria-label="Notifications">
        <Bell size={20} />
      </button>

      {/* Profile link — clicking opens the profile page */}
      <Link to="/profile" className="profile topbar-profile-link" aria-label="My profile">
        <span>{initials}</span>
        <div>
          <strong>{user?.fullName ?? "GIS User"}</strong>
          <small>{user?.role.replaceAll("_", " ") ?? "Member"}</small>
        </div>
      </Link>

      <button className="icon-button" aria-label="Log out" onClick={logout}>
        <LogOut size={19} />
      </button>
    </header>
  );
}
