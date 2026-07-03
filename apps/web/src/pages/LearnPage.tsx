import { BookOpenCheck, Download, PlayCircle } from "lucide-react";
import { SectionHeading } from "../components/SectionHeading";

export function LearnPage() {
  return (
    <section className="module-page">
      <SectionHeading eyebrow="Learning system" title="Course player and curriculum" />
      <div className="module-grid">
        <article className="module-card featured">
          <BookOpenCheck size={28} />
          <h3>GIS 200: Geospatial Analytics</h3>
          <p>Structured lessons, guided practicals, assignments, datasets, and trainer feedback.</p>
          <button className="primary-button">
            <PlayCircle size={18} />
            Open course
          </button>
        </article>
        <article className="module-card">
          <Download size={24} />
          <h3>Dataset library</h3>
          <p>Nigeria boundaries, OSM extracts, satellite imagery, DEMs, and field collection templates.</p>
        </article>
      </div>
    </section>
  );
}
