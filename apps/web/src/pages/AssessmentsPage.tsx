import { ClipboardCheck, Clock, FileCheck2 } from "lucide-react";
import { SectionHeading } from "../components/SectionHeading";

export function AssessmentsPage() {
  return (
    <section className="module-page">
      <SectionHeading eyebrow="Assessment engine" title="Tests, practicals, and grading" />
      <div className="module-grid">
        <article className="module-card"><Clock size={24} /><h3>Timed exams</h3><p>Secure quiz rounds with countdowns and instant scoring.</p></article>
        <article className="module-card"><FileCheck2 size={24} /><h3>Practical submissions</h3><p>Maps, screenshots, tables, dashboards, and GIS project files.</p></article>
        <article className="module-card"><ClipboardCheck size={24} /><h3>Rubric grading</h3><p>Trainer assessment, feedback, approval, and result publishing.</p></article>
      </div>
    </section>
  );
}
