import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  /**
   * - string → rendered as a "View all →" link-style text button
   * - ReactNode → rendered as-is (e.g. a <button> or <Link>)
   */
  action?: ReactNode;
  compact?: boolean;
  /** Optional route for a "View all" link action */
  href?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  action,
  compact = false,
  href,
}: SectionHeadingProps) {
  return (
    <div className={`section-heading-v2${compact ? " section-heading-v2--compact" : ""}`}>
      {/* Left accent bar */}
      <div className="section-heading-bar" aria-hidden="true" />

      <div className="section-heading-copy">
        <span className="section-eyebrow">{eyebrow}</span>
        <h2 className="section-title">{title}</h2>
      </div>

      {/* Action slot */}
      {typeof action === "string" && href ? (
        <Link to={href} className="section-action-link">
          {action}
          <ArrowRight size={14} />
        </Link>
      ) : typeof action === "string" ? (
        <button className="section-action-link" type="button">
          {action}
          <ArrowRight size={14} />
        </button>
      ) : action ? (
        <div className="section-action-slot">{action}</div>
      ) : null}
    </div>
  );
}
