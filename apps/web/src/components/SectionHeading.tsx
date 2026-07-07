import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  /** Pass a string for a plain text-button, or a ReactNode for a custom element. */
  action?: ReactNode;
  compact?: boolean;
};

export function SectionHeading({ eyebrow, title, action, compact = false }: SectionHeadingProps) {
  return (
    <div className={compact ? "section-heading compact" : "section-heading"}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {typeof action === "string" ? (
        <button className="text-button">{action}</button>
      ) : action ? (
        action
      ) : null}
    </div>
  );
}
