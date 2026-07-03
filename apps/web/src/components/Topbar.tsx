import { Bell, Menu, Search } from "lucide-react";

export function Topbar() {
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
      <div className="profile">
        <span>DA</span>
        <div>
          <strong>Demo Learner</strong>
          <small>Gold League</small>
        </div>
      </div>
    </header>
  );
}
