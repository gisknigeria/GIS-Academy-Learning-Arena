import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { PaymentStatus } from "../types/auth";

type Props = {
  paymentStatus: PaymentStatus;
};

type BannerConfig = {
  icon: typeof Clock;
  title: string;
  body: string;
  cta: string;
  variant: "warning" | "error" | "success";
};

const CONFIGS: Partial<Record<PaymentStatus, BannerConfig>> = {
  PENDING: {
    icon: Clock,
    title: "Payment pending",
    body: "Your account is active but paid course content is locked until payment is confirmed.",
    cta: "Pay now",
    variant: "warning",
  },
  OVERDUE: {
    icon: AlertTriangle,
    title: "Payment overdue",
    body: "You have an outstanding balance. Paid content will remain locked until it's resolved.",
    cta: "Resolve payment",
    variant: "error",
  },
  BLOCKED: {
    icon: ShieldAlert,
    title: "Account restricted",
    body: "Your account has been restricted. Please contact support.",
    cta: "Contact support",
    variant: "error",
  },
  PAID: {
    icon: CheckCircle2,
    title: "Payment confirmed",
    body: "Your payment is confirmed — all course content is unlocked.",
    cta: "",
    variant: "success",
  },
};

export function PaymentStatusBanner({ paymentStatus }: Props) {
  const { redeemPromo } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const config = CONFIGS[paymentStatus];

  // NOT_REQUIRED (admin/trainer) or PAID after dismiss — no banner
  if (!config || dismissed) return null;
  // Don't show the "confirmed" banner by default — it's noise
  if (paymentStatus === "PAID") return null;

  const Icon = config.icon;

  async function handlePromoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPromoMessage("");
    setPromoError("");
    setIsSubmitting(true);

    try {
      await redeemPromo(promoCode);
      setPromoMessage("Promo accepted. Paid courses are unlocked.");
      setPromoCode("");
    } catch {
      setPromoError("Invalid promo code. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={`payment-banner payment-banner-${config.variant}`}
      role="alert"
      aria-label={config.title}
    >
      <Icon size={18} />
      <div className="payment-banner-body">
        <strong>{config.title}</strong>
        <span>{config.body}</span>
      </div>
      {config.cta && (
        <form className="promo-form" onSubmit={handlePromoSubmit}>
          <input
            aria-label="Promo code"
            placeholder="Promo code"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
          />
          <button className="payment-banner-cta" disabled={isSubmitting}>
            {isSubmitting ? "Checking..." : "Apply"}
          </button>
        </form>
      )}
      {promoMessage ? <span className="promo-message">{promoMessage}</span> : null}
      {promoError ? <span className="promo-error">{promoError}</span> : null}
      <button
        className="payment-banner-close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
