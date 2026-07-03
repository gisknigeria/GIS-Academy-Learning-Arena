import { CalendarDays, MapPinned, Users } from "lucide-react";
import { SectionHeading } from "../components/SectionHeading";

export function ClassesPage() {
  return (
    <section className="module-page">
      <SectionHeading eyebrow="Onsite and hybrid" title="Classes, cohorts, and attendance" />
      <div className="module-grid">
        <article className="module-card"><Users size={24} /><h3>Ibadan Weekend Cohort</h3><p>42 learners, GIS 100 to GIS 200 track.</p></article>
        <article className="module-card"><CalendarDays size={24} /><h3>Next session</h3><p>Field mapping practical and attendance review.</p></article>
        <article className="module-card"><MapPinned size={24} /><h3>Field activity</h3><p>GPS points, facility inventory, and supervised data checks.</p></article>
      </div>
    </section>
  );
}
