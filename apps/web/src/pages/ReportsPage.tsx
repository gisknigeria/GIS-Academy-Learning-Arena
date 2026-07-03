import { BarChart3, Building2, TrendingUp } from "lucide-react";
import { SectionHeading } from "../components/SectionHeading";

export function ReportsPage() {
  return (
    <section className="module-page">
      <SectionHeading eyebrow="Analytics" title="Performance intelligence and reports" />
      <div className="module-grid">
        <article className="module-card"><TrendingUp size={24} /><h3>Student growth</h3><p>Progress, speed, accuracy, weak topics, and improvement trend.</p></article>
        <article className="module-card"><Building2 size={24} /><h3>School ranking</h3><p>School, LGA, state, regional, and national performance views.</p></article>
        <article className="module-card"><BarChart3 size={24} /><h3>Admin exports</h3><p>Course, trainer, corporate, Olympiad, and certificate reports.</p></article>
      </div>
    </section>
  );
}
