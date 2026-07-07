import { Eye, EyeOff, Lock, LogIn, Mail, Trophy, Users, Zap } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";

const SOCIAL_PROOF = [
  { icon: Users, value: "12,400+", label: "Learners" },
  { icon: Trophy, value: "340+",    label: "Competitions" },
  { icon: Zap,   value: "98%",      label: "Pass rate"  },
];

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState("");
  const [isSubmitting, setSubmit]   = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/dashboard";

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmit(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      setError("Incorrect email or password. Please try again.");
    } finally {
      setSubmit(false);
    }
  }

  return (
    <main className="auth-page">
      {/* ── Left visual panel ── */}
      <section className="auth-visual" aria-hidden="false">
        {/* Brand */}
        <div className="auth-visual-brand">
          <div className="auth-logo-mark">
            <img src={logoMark} alt="GIS Academy" />
          </div>
          <span className="auth-visual-brand-name">GIS Academy</span>
        </div>

        <div className="auth-visual-copy">
          <span className="eyebrow">GIS Konsult Learning Arena</span>
          <h1>Sign in and defend your rank.</h1>
          <p>
            Access courses, live competitions, certificates, leaderboards,
            and trainer feedback — all in one arena.
          </p>
        </div>

        {/* Social proof */}
        <div className="auth-social-proof">
          {SOCIAL_PROOF.map(({ icon: Icon, value, label }) => (
            <div className="auth-proof-stat" key={label}>
              <Icon size={16} aria-hidden="true" />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Right form panel ── */}
      <section className="auth-panel">
        <div className="auth-panel-header">
          <div className="auth-panel-logo">
            <img src={logoMark} alt="GIS Academy" />
          </div>
          <span className="eyebrow" style={{ color: "var(--brand-700)" }}>
            Welcome back
          </span>
          <h2>Log in to your account</h2>
          <p className="auth-panel-sub">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Create one free
            </Link>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <div className="auth-field-row">
              <label htmlFor="login-password">Password</label>
              <Link to="/login" className="auth-forgot">
                Forgot password?
              </Link>
            </div>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-show-pass"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="primary-button auth-submit-btn"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              "Signing in…"
            ) : (
              <>
                <LogIn size={17} />
                Enter arena
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
