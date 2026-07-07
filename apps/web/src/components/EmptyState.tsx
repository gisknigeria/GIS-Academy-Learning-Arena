import type { LucideIcon } from "lucide-react";
import { PackageOpen } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** "default" — dashed border card; "subtle" — no border, lighter padding */
  variant?: "default" | "subtle";
};

/**
 * Reusable empty state component.
 *
 * @example
 * <EmptyState
 *   icon={Trophy}
 *   title="No competitions yet"
 *   description="Check back later for upcoming events."
 *   action={<button className="primary-button">Browse competitions</button>}
 * />
 */
export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div className={`empty-state empty-state--${variant}`} role="status">
      <span className="empty-state-icon" aria-hidden="true">
        <Icon size={40} strokeWidth={1.4} />
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
