import type { QuickAction } from "../data/dashboardData";

type QuickActionsGridProps = {
  actions: QuickAction[];
};

const toneClass: Record<QuickAction["tone"], string> = {
  green: "qa-green",
  orange: "qa-orange",
  blue: "qa-blue",
  purple: "qa-purple",
};

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  if (actions.length === 0) return null;

  return (
    <section className="quick-actions-grid" aria-label="Quick actions">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            className={`quick-action-card ${toneClass[action.tone]}`}
          >
            <div className="qa-icon">
              <Icon size={20} />
            </div>
            <strong>{action.label}</strong>
            <p>{action.description}</p>
          </button>
        );
      })}
    </section>
  );
}
