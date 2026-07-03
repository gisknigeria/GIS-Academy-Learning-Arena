type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  action?: string;
  compact?: boolean;
};

export function SectionHeading({ eyebrow, title, action, compact = false }: SectionHeadingProps) {
  return (
    <div className={compact ? "section-heading compact" : "section-heading"}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action ? <button className="text-button">{action}</button> : null}
    </div>
  );
}
