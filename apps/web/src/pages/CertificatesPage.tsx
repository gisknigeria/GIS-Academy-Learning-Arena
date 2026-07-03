import { Award, BadgeCheck, Share2 } from "lucide-react";
import { SectionHeading } from "../components/SectionHeading";

export function CertificatesPage() {
  return (
    <section className="module-page">
      <SectionHeading eyebrow="Recognition" title="Certificates, awards, and verification" />
      <div className="module-grid">
        <article className="module-card featured"><Award size={28} /><h3>GIS 100 Certificate</h3><p>Ready after trainer approval and final result confirmation.</p></article>
        <article className="module-card"><BadgeCheck size={24} /><h3>Verification portal</h3><p>Public certificate ID lookup for employers and institutions.</p></article>
        <article className="module-card"><Share2 size={24} /><h3>Share cards</h3><p>Competition wins, badges, and Hall of Fame announcements.</p></article>
      </div>
    </section>
  );
}
