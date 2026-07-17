import { AlertTriangle, Lock, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
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
  const { redeemPromo } = useAuth();
  const [promoCode, setPromoCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function handleUnlock() {
    if (!promoCode.trim()) {
      setStatus("error");
      return;
    }

    setLoading(true);
    setStatus("idle");
    try {
      await redeemPromo(promoCode.trim());
      setStatus("success");
      setPromoCode("");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

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
      <div className="promo-form" style={{ marginTop: 8 }}>
        <input
          aria-label="Promo code"
          placeholder="Unlock code"
          value={promoCode}
          onChange={(event) => {
            setPromoCode(event.target.value);
            if (status !== "idle") setStatus("idle");
          }}
        />
        <button className="primary-button payment-gate-cta" onClick={() => void handleUnlock()} disabled={loading}>
          {loading ? "Checking..." : "Unlock next level"}
        </button>
      </div>
      {status === "success" ? <p className="promo-message">Promo code accepted. Your access is unlocked.</p> : null}
      {status === "error" ? <p className="promo-error">Invalid promo code. Try again.</p> : null}
    </div>
  );
}
