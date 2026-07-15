import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"STUDENT" | "TRAINER">("STUDENT");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register({
        fullName,
        email,
        phone,
        password,
        role: accountType,
      });
      // Send new users straight to onboarding to set up their learner profile
      navigate("/onboarding", { replace: true });
    } catch {
      setError("Registration failed. The email or phone may already be in use.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <img src={logoMark} alt="" />
        <span className="eyebrow">Free registration</span>
        <h1>Create your Knowledge Hub profile and learn in your world.</h1>
        <p>
          Sign up in seconds — then we'll walk you through setting up your
          learning profile, interests, and preferences step by step.
        </p>
      </section>

      <section className="auth-panel">
        <div>
          <span className="eyebrow">Join Knowledge Hub</span>
          <h2>Create account</h2>
        </div>
        <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
          <label>
            Full name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234…"
              autoComplete="tel"
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>

          <div className="auth-role-picker" role="radiogroup" aria-label="Account type">
            <button
              type="button"
              className={accountType === "STUDENT" ? "selected" : ""}
              onClick={() => setAccountType("STUDENT")}
              aria-pressed={accountType === "STUDENT"}
            >
              <strong>Learner</strong>
              <span>Start learning immediately.</span>
            </button>
            <button
              type="button"
              className={accountType === "TRAINER" ? "selected" : ""}
              onClick={() => setAccountType("TRAINER")}
              aria-pressed={accountType === "TRAINER"}
            >
              <strong>Trainer</strong>
              <span>Requires approval before dashboard access.</span>
            </button>
          </div>

          <div className="auth-register-note">
            <span>🎯</span>
            <p>
              After signing up you'll complete a quick onboarding wizard to
              personalise your experience — courses, badges, challenges, and
              recommendations will all be tailored to you.
            </p>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account & continue →"}
          </button>
        </form>
        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
