import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      <section className="auth-visual">
        <img src={logoMark} alt="" />
        <span className="eyebrow">GIS Konsult Learning Arena</span>
        <h1>Sign in, continue learning, and defend your rank.</h1>
        <p>Access your GIS courses, live competitions, certificates, leaderboards, and trainer feedback.</p>
      </section>

      <section className="auth-panel">
        <div>
          <span className="eyebrow">Welcome back</span>
          <h2>Log in</h2>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Enter arena"}
          </button>
        </form>
        <p className="auth-switch">
          New learner? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
