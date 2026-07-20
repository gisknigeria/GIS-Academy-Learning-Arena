import { FormEvent, useState } from "react";
import { Award, BadgeCheck, BarChart3, BookOpen, Eye, EyeOff, Map, MessageCircle, ShieldCheck, Sparkles, Trophy, Zap } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
  const visualFeatures = [
    { label: "Live Courses", icon: BookOpen },
    { label: "Competitions", icon: Trophy },
    { label: "Certificates", icon: BadgeCheck },
    { label: "Trainer Feedback", icon: MessageCircle },
    { label: "GIS Skills", icon: Map },
  ];
  const floatingCards = [
    { icon: Award, title: "Certificate earned", detail: "GIS Fundamentals" },
    { icon: Zap, title: "Challenge live", detail: "Map Sprint — 14 joined" },
    { icon: BarChart3, title: "84% complete", detail: "Remote Sensing module" },
  ];

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      setError("Login failed. Check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      {/* ── Left visual panel ── */}
      <section className="auth-visual" aria-hidden="false">
        <div className="auth-visual__bg" aria-hidden="true">
          <AuthBgPattern />
        </div>

        <div className="auth-visual__content">
          <div className="auth-visual__logo-wrap">
            <img src={logoMark} alt="Knowledge Hub logo" />
          </div>

          <div className="auth-visual__badge">Knowledge Hub</div>

          <h1 className="auth-visual__headline">
            Explore.<br />Learn.<br />Compete<br />
            <span className="auth-visual__accent">&amp; Be Certified.</span>
          </h1>

          <p className="auth-visual__sub">
            Connecting young learners, educators, and industry partners to practical skills,
            live challenges, certificates, feedback, and real-world opportunities.
          </p>

          <div className="auth-visual__tagline">
            <Sparkles size={16} /> Build skills. Prove talent. Connect to opportunity.
          </div>

          {/* Feature pills */}
          <div className="auth-visual__features">
            {visualFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <span key={feature.label} className="auth-visual__feature-pill">
                  <Icon size={14} />
                  <span>{feature.label}</span>
                </span>
              );
            })}
          </div>

          {/* Stats strip */}
          <div className="auth-visual__stats">
            <div><strong>10K+</strong><span>Learners</span></div>
            <div><strong>200+</strong><span>Courses</span></div>
            <div><strong>50+</strong><span>Challenges</span></div>
            <div><strong>95%</strong><span>Pass rate</span></div>
          </div>
        </div>

        {/* Floating illustration cards */}
        <div className="auth-visual__cards" aria-hidden="true">
          {floatingCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={`auth-float-card auth-float-card--${index === 0 ? "a" : index === 1 ? "b" : "c"}`}>
                <span><Icon size={18} /></span>
                <div><strong>{card.title}</strong><small>{card.detail}</small></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Right form panel ── */}
      <section className="auth-panel">
        <div className="auth-panel__inner">
          <div className="auth-panel__header">
            <span className="auth-panel__eyebrow">Welcome back</span>
            <h2>Log in to<br />Knowledge Hub</h2>
            <p>Pick up where you left off — your missions, badges, and progress are waiting.</p>
          </div>

          <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
            <label>
              Email address
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" placeholder="you@example.com" />
            </label>
            <label>
              Password
              <div className="auth-input-with-icon">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••" />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Enter Knowledge Hub →"}
            </button>
          </form>

          <div className="auth-panel__divider"><span>New here?</span></div>

          <p className="auth-switch">
            <Link to="/register" className="auth-switch__cta">Create a free account →</Link>
          </p>

          <div className="auth-panel__trust">
            <span><ShieldCheck size={14} /> Secure login</span>
            <span>·</span>
            <span><Sparkles size={14} /> Free to join</span>
            <span>·</span>
            <span><BadgeCheck size={14} /> No card needed</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthBgPattern() {
  return (
    <svg className="auth-bg-svg" viewBox="0 0 900 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Grid of dots */}
      {Array.from({ length: 12 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => (
          <circle key={`${row}-${col}`} cx={col * 90 + 45} cy={row * 80 + 40} r="2" fill="rgba(255,255,255,0.12)" />
        ))
      )}
      {/* Large decorative rings */}
      <circle cx="750" cy="150" r="180" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <circle cx="750" cy="150" r="120" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle cx="750" cy="150" r="60"  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx="100" cy="750" r="220" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <circle cx="100" cy="750" r="140" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {/* Accent shapes */}
      <polygon points="820,400 860,460 780,460" fill="rgba(216,255,120,0.08)" />
      <polygon points="60,300  90,350  30,350"  fill="rgba(216,255,120,0.06)" />
      <rect x="680" y="620" width="80" height="80" rx="8" fill="rgba(255,255,255,0.04)" transform="rotate(15,720,660)" />
      <rect x="40" y="120" width="50" height="50" rx="6" fill="rgba(255,255,255,0.04)" transform="rotate(-10,65,145)" />
      {/* Connecting lines */}
      <line x1="0" y1="450" x2="900" y2="450" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="450" y1="0" x2="450" y2="900" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="0" y1="0" x2="900" y2="900" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
      {/* Map pin icon SVG (GIS reference) */}
      <g transform="translate(380,200) scale(2.2)" opacity="0.1">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>
      </g>
      {/* Trophy icon (competition reference) */}
      <g transform="translate(620,580) scale(2)" opacity="0.09">
        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" fill="white"/>
      </g>
    </svg>
  );
}
