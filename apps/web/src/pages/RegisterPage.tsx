import { FormEvent, useState } from "react";
import { BadgeCheck, BookOpen, Eye, EyeOff, Globe, GraduationCap, Map, MessageCircle, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName]       = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"STUDENT" | "TRAINER">("STUDENT");
  const [error, setError]             = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const visualFeatures = [
    { label: "Live Courses", icon: BookOpen },
    { label: "Competitions", icon: Trophy },
    { label: "Certificates", icon: BadgeCheck },
    { label: "Trainer Feedback", icon: MessageCircle },
    { label: "GIS Skills", icon: Map },
  ];
  const floatingCards = [
    { icon: BadgeCheck, title: "Free certificates", detail: "Earn as you complete" },
    { icon: Map, title: "GIS skills", detail: "Map the future" },
    { icon: Globe, title: "Global community", detail: "10K+ learners worldwide" },
  ];

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await register({ fullName, email, phone, password, role: accountType });
      navigate("/onboarding", { replace: true });
    } catch {
      setError("Registration failed. The email or phone may already be in use.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page auth-page--register">
      {/* ── Left visual panel ── */}
      <section className="auth-visual" aria-hidden="false">
        <div className="auth-visual__bg" aria-hidden="true">
          <RegisterBgPattern />
        </div>

        <div className="auth-visual__content">
          <div className="auth-visual__logo-wrap">
            <img src={logoMark} alt="Knowledge Hub logo" />
          </div>

          <div className="auth-visual__badge">Free Registration</div>

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

          {/* Journey steps */}
          <div className="auth-visual__journey">
            <div className="auth-journey-step">
              <span className="auth-journey-step__num">1</span>
              <div>
                <strong>Create account</strong>
                <small>Name, email, and password — 30 seconds</small>
              </div>
            </div>
            <div className="auth-journey-step__connector" aria-hidden="true" />
            <div className="auth-journey-step">
              <span className="auth-journey-step__num">2</span>
              <div>
                <strong>Personalise</strong>
                <small>Tell us your interests and goals</small>
              </div>
            </div>
            <div className="auth-journey-step__connector" aria-hidden="true" />
            <div className="auth-journey-step">
              <span className="auth-journey-step__num">3</span>
              <div>
                <strong>Start learning</strong>
                <small>Your personalised dashboard is ready</small>
              </div>
            </div>
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
      <section className="auth-panel auth-panel--register">
        <div className="auth-panel__inner">
          <div className="auth-panel__header">
            <span className="auth-panel__eyebrow">Join Knowledge Hub</span>
            <h2>Create your<br />free account</h2>
            <p>Sign up in seconds — then we'll personalise your experience step by step.</p>
          </div>

          <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
            <label>
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" placeholder="Your full name" />
            </label>
            <label>
              Email address
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" placeholder="you@example.com" />
            </label>
            <label>
              Phone <span className="auth-optional">(optional)</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" autoComplete="tel" />
            </label>
            <label>
              Password
              <div className="auth-input-with-icon">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} minLength={8} required autoComplete="new-password" placeholder="Min. 8 characters" />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {/* Account type */}
            <div className="auth-role-picker" role="radiogroup" aria-label="Account type">
              <button type="button" className={accountType === "STUDENT" ? "selected" : ""} onClick={() => setAccountType("STUDENT")} aria-pressed={accountType === "STUDENT"}>
                <span className="auth-role-icon"><GraduationCap size={18} /></span>
                <strong>Learner</strong>
                <span>Start learning immediately</span>
              </button>
              <button type="button" className={accountType === "TRAINER" ? "selected" : ""} onClick={() => setAccountType("TRAINER")} aria-pressed={accountType === "TRAINER"}>
                <span className="auth-role-icon"><BookOpen size={18} /></span>
                <strong>Trainer</strong>
                <span>Requires approval</span>
              </button>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button className="primary-button auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account & continue →"}
            </button>
          </form>

          <div className="auth-panel__divider"><span>Already have an account?</span></div>
          <p className="auth-switch">
            <Link to="/login" className="auth-switch__cta">Log in instead →</Link>
          </p>

          <div className="auth-panel__trust">
            <span><ShieldCheck size={14} /> Secure & private</span>
            <span>·</span>
            <span><Sparkles size={14} /> 100% free</span>
            <span>·</span>
            <span><BadgeCheck size={14} /> No card needed</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function RegisterBgPattern() {
  return (
    <svg className="auth-bg-svg" viewBox="0 0 900 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Hexagonal grid pattern */}
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => {
          const cx = col * 110 + (row % 2 === 0 ? 55 : 0) + 20;
          const cy = row * 96 + 48;
          return <polygon key={`${row}-${col}`} points={`${cx},${cy - 30} ${cx + 26},${cy - 15} ${cx + 26},${cy + 15} ${cx},${cy + 30} ${cx - 26},${cy + 15} ${cx - 26},${cy - 15}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })
      )}
      {/* Radial burst from top right */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x2 = 820 + Math.cos(angle) * 300;
        const y2 = 80  + Math.sin(angle) * 300;
        return <line key={i} x1="820" y1="80" x2={x2} y2={y2} stroke="rgba(216,255,120,0.05)" strokeWidth="1" />;
      })}
      {/* Large arcs */}
      <path d="M 0 600 Q 450 200 900 600" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
      <path d="M 0 750 Q 450 350 900 750" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      {/* Certificate / award shapes */}
      <circle cx="800" cy="700" r="80" fill="none" stroke="rgba(216,255,120,0.08)" strokeWidth="2" />
      <circle cx="800" cy="700" r="55" fill="none" stroke="rgba(216,255,120,0.06)" strokeWidth="1" />
      <circle cx="800" cy="700" r="30" fill="rgba(216,255,120,0.05)" />
      {/* Star shapes */}
      <g transform="translate(120,180) scale(1.5)" opacity="0.08">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="rgba(216,255,120,1)" />
      </g>
      <g transform="translate(700,400) scale(1.2)" opacity="0.07">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="white" />
      </g>
      {/* Book/learn icon */}
      <g transform="translate(50,550) scale(2.5)" opacity="0.08">
        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="white"/>
      </g>
    </svg>
  );
}
