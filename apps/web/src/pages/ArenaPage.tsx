import { RadioTower, Swords, Trophy, Users } from "lucide-react";
import { ArenaLobby } from "../components/ArenaLobby";
import { SectionHeading } from "../components/SectionHeading";
import { competitions } from "../data/dashboardData";

export function ArenaPage() {
  return (
    <section className="module-page">
      <SectionHeading eyebrow="Competition arena" title="Live battles and Olympiad contests" />
      <div className="mode-grid">
        <article className="mode-card"><Swords size={24} /><strong>Head-to-head</strong><span>Challenge anyone online.</span></article>
        <article className="mode-card"><Users size={24} /><strong>Team battle</strong><span>Schools, cohorts, or groups.</span></article>
        <article className="mode-card"><RadioTower size={24} /><strong>Live timed</strong><span>Everyone starts together.</span></article>
        <article className="mode-card"><Trophy size={24} /><strong>Olympiad</strong><span>Regional and national ranking.</span></article>
      </div>
      <div className="workstream">
        <SectionHeading eyebrow="Open now" title="Challenge lobby" compact />
        <ArenaLobby competitions={competitions} />
      </div>
    </section>
  );
}
