import { AlertTriangle, Lock, ShieldAlert } from "lucide-react";
import type { AccessStatus } from "../types/course";
import { ACCESS_REASON_LABELS } from "../types/course";

type Props = {
  accessStatus: AccessStatus & { allowed: false };
  /** Compact variant for use inside cards — no full-bleed overlay */
  compact?: boolean;
};

const ICONS = {
  payment_required: Lock,
  account_overdue: AlertTriangle,
  account_blocked: ShieldAlert,
};

export function PaymentGate({ accessStatus, compact = false }: Props) {
  const config = ACCESS_REASON_LABELS[accessStatus.reason];
  const Icon = ICONS[accessStatus.reason];

  if (compact) {
    return (
      <div className="payment-gate-compact" role="status" aria-label={config.title}>
        <Icon size={15} />
        <span>{config.title}</span>
      </div>
    );
  }

  return (
    <div className="payment-gate" role="status" aria-label={config.title}>
      <div className="payment-gate-icon">
        <Icon size={28} />
      </div>
      <h3>{config.title}</h3>
      <p>{config.body}</p>
      <button className="primary-button payment-gate-cta">{config.cta}</button>
    </div>
  );
}
