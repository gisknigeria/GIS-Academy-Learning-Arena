import { Eye, EyeOff, Lock, Mail, Phone, Trophy, UserPlus, Users, Zap } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";

const SOCIAL_PROOF = [
  { icon: Users, value: "12,400+", label: "Learners" },
  { icon: Trophy, value: "340+",    label: "Competitions" },
  { icon: Zap,   value: "98%",      label: "Pass rate"  },
];

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState("");
  const [isSubmitting, setSubmit] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmit(true);
    try {
      await register({ fullName, email, phone, password, role: "STUDENT" });
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Registration failed. The email or phone may already be in use.");
    } finally {
      setSubmit(false);
    }
  }

  const strength =
    password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;

  return (
    <main className="auth-page">
      {/* ── Left visual panel ── */}
      <section className="auth-visual" aria-hidden="false">
        <div className="auth-visual-brand">
          <div className="auth-logo-mark">
            <img src={logoMark} alt="GIS Academy" />
          </div>
          <span className="auth-visual-brand-name">GIS Academy</span>
        </div>

        <div className="auth-visual-copy">
          <span className="eyebrow">Free registration</span>
          <h1>Start your GIS journey today.</h1>
          <p>
            Join thousands of learners mastering GIS, competing in live
            challenges, and earning globally recognised certificates.
          </p>
        </div>

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
            Join the arena
          </span>
          <h2>Create your account</h2>
          <p className="auth-panel-sub">
            Already registered?{" "}
            <Link to="/login" className="auth-link">
              Log in
            </Link>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full name */}
          <div className="auth-field">
            <label htmlFor="reg-name">Full name</label>
            <div className="auth-input-wrap">
              <UserPlus size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Amina Yusuf"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="auth-field">
            <label htmlFor="reg-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="auth-field">
            <label htmlFor="reg-phone">
              Phone <span className="auth-optional">(optional)</span>
            </label>
            <div className="auth-input-wrap">
              <Phone size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="reg-password">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="reg-password"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
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

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="auth-strength" aria-label={`Password strength: ${["", "Weak", "Fair", "Strong"][strength]}`}>
                <div className="auth-strength-track">
                  <div
                    className={`auth-strength-fill auth-strength-${["", "weak", "fair", "strong"][strength]}`}
                    style={{ width: `${(strength / 3) * 100}%` }}
                  />
                </div>
                <span className={`auth-strength-label auth-strength-label-${["", "weak", "fair", "strong"][strength]}`}>
                  {["", "Weak", "Fair", "Strong"][strength]}
                </span>
              </div>
            )}
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
              "Creating account…"
            ) : (
              <>
                <UserPlus size={17} />
                Create account
              </>
            )}
          </button>

          <p className="auth-terms">
            By creating an account you agree to our{" "}
            <a href="#" className="auth-link">Terms of Service</a> and{" "}
            <a href="#" className="auth-link">Privacy Policy</a>.
          </p>
        </form>
      </section>
    </main>
  );
}
