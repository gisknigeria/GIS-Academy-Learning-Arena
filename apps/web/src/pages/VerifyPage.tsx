import {
  AlertCircle,
  Award,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { certificatesApi } from "../lib/certificates-api";
import type { VerifiedCertificate } from "../types/certificate";
import logoMark from "../assets/gis-academy-logo.svg";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function VerifyPage() {
  const { verificationId } = useParams<{ verificationId?: string }>();

  const [query, setQuery] = useState(verificationId ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifiedCertificate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  // If a verificationId was passed in the URL, look it up immediately
  useEffect(() => {
    if (verificationId) {
      void lookup(verificationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId]);

  async function lookup(id: string) {
    if (!id.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError("");
    try {
      const data = await certificatesApi.verify(id.trim());
      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setNotFound(true);
      } else {
        setError("Could not reach the verification service. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await lookup(query);
  }

  return (
    <div className="verify-page">
      {/* Header */}
      <header className="verify-header">
        <div className="verify-header-inner">
          <Link to="/login" className="verify-brand">
            <img src={logoMark} alt="GIS Konsult" width={32} />
            <span>Knowledge Hub</span>
          </Link>
          <Link to="/login" className="secondary-button small-button">
            <ExternalLink size={14} />
            Sign in
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="verify-main">
        <div className="verify-card">
          <div className="verify-card-top">
            <Award size={36} />
            <h1>Certificate Verification</h1>
            <p>
              Enter a certificate verification ID below to confirm its authenticity.
              This service is public and requires no login.
            </p>
          </div>

          {/* Search form */}
          <form className="verify-form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="verify-input-wrap">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 3f4a1b2c-…"
                required
                autoFocus={!verificationId}
                aria-label="Verification ID"
              />
            </div>
            <button className="primary-button" disabled={loading || !query.trim()}>
              {loading ? <Loader2 size={16} className="spin" /> : <BadgeCheck size={16} />}
              {loading ? "Checking…" : "Verify"}
            </button>
          </form>

          {/* Error state */}
          {error && (
            <div className="verify-result verify-result--error">
              <AlertCircle size={22} />
              <p>{error}</p>
            </div>
          )}

          {/* Not found state */}
          {notFound && !loading && (
            <div className="verify-result verify-result--notfound">
              <XCircle size={36} />
              <h2>Certificate not found</h2>
              <p>
                No certificate matches the ID <strong>{query}</strong>. Please
                check the ID and try again. If you believe this is an error,
                contact GIS Konsult support.
              </p>
            </div>
          )}

          {/* Valid certificate */}
          {result && !loading && (
            <div className="verify-result verify-result--valid">
              <div className="verify-valid-icon">
                <CheckCircle2 size={40} />
              </div>

              <div className="verify-certificate-card">
                {/* Decorative header */}
                <div className="verify-cert-header">
                  <img src={logoMark} alt="" width={28} />
                  <span>Knowledge Hub</span>
                  <span className="verify-cert-badge">Verified ✓</span>
                </div>

                <div className="verify-cert-body">
                  <p className="verify-cert-label">This certifies that</p>
                  <h2 className="verify-cert-name">{result.learner?.fullName ?? "Learner"}</h2>
                  <p className="verify-cert-label">has successfully completed</p>
                  <h3 className="verify-cert-title">{result.title}</h3>

                  <div className="verify-cert-meta">
                    <div>
                      <span>Certificate No.</span>
                      <strong>{result.certificateNo}</strong>
                    </div>
                    <div>
                      <span>Date issued</span>
                      <strong>{formatDate(result.issuedAt)}</strong>
                    </div>
                    <div>
                      <span>Verification ID</span>
                      <strong className="verify-cert-id">{result.verificationId}</strong>
                    </div>
                    {result.learner?.email && (
                      <div>
                        <span>Recipient email</span>
                        <strong>{result.learner.email}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="verify-cert-footer">
                  <CheckCircle2 size={14} />
                  Authenticity verified by Knowledge Hub
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="verify-footer">
        <p>
          © {new Date().getFullYear()} Knowledge Hub ·{" "}
          <Link to="/login">Platform login</Link>
        </p>
      </footer>
    </div>
  );
}
