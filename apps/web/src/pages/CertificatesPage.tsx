import { Award, BadgeCheck, ExternalLink, Loader2, PlusCircle, Search, Share2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { certificatesApi } from "../lib/certificates-api";
import { usersApi, type AdminUser } from "../lib/users-api";
import type { Certificate, VerifiedCertificate } from "../types/certificate";
import type { UserRole } from "../types/auth";

const ISSUE_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "TRAINING_MANAGER",
  "TRAINER",
  "EXAMINER",
  "JUDGE",
  "OLYMPIAD_COORDINATOR",
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CertificatesPage() {
  const { token, user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueUserId, setIssueUserId] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [verifyId, setVerifyId] = useState("");
  const [verified, setVerified] = useState<VerifiedCertificate | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const canIssue = Boolean(user && ISSUE_ROLES.includes(user.role));

  const loadCertificates = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = canIssue
        ? await certificatesApi.list(token)
        : await certificatesApi.mine(token);
      setCertificates(data);
    } catch {
      setError("Could not load certificates.");
    } finally {
      setLoading(false);
    }
  }, [canIssue, token]);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  useEffect(() => {
    async function loadUsers() {
      if (!token || !canIssue) return;

      try {
        const result = await usersApi.list(token, { limit: 100 });
        setUsers(result.data);
        setIssueUserId((current) => current || result.data[0]?.id || "");
      } catch {
        setUsers([]);
      }
    }

    void loadUsers();
  }, [canIssue, token]);

  const featuredCertificate = useMemo(() => certificates[0], [certificates]);

  async function handleIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !issueUserId || !issueTitle.trim()) return;
    setIssuing(true);
    setError("");

    try {
      const created = await certificatesApi.issue(token, {
        userId: issueUserId,
        title: issueTitle.trim(),
      });
      setCertificates((prev) => [created, ...prev]);
      setIssueTitle("");
      setShowIssueForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue certificate.");
    } finally {
      setIssuing(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verifyId.trim()) return;
    setVerifying(true);
    setVerified(null);
    setVerifyError("");

    try {
      const data = await certificatesApi.verify(verifyId.trim());
      setVerified(data);
    } catch {
      setVerifyError("No certificate found for that verification ID.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <section className="module-page certificates-page">
      <SectionHeading
        eyebrow="Recognition"
        title="Certificates, awards, and verification"
        action={
          canIssue ? (
            <button className="primary-button small-button" onClick={() => setShowIssueForm(true)}>
              <PlusCircle size={15} />
              Issue certificate
            </button>
          ) : undefined
        }
      />

      <div className="module-grid certificates-summary-grid">
        <article className="module-card featured certificate-hero-card">
          <Award size={28} />
          <h3>{featuredCertificate?.title ?? "Your GIS achievement vault"}</h3>
          <p>
            {featuredCertificate
              ? `Certificate ${featuredCertificate.certificateNo} was issued on ${formatDate(featuredCertificate.issuedAt)}.`
              : "Complete courses, assessments, and arena challenges to unlock verified certificates."}
          </p>
        </article>
        <article className="module-card">
          <BadgeCheck size={24} />
          <h3>Verification portal</h3>
          <p>Check any certificate using its unique verification ID.</p>
        </article>
        <article className="module-card">
          <Share2 size={24} />
          <h3>Share-ready proof</h3>
          <p>Use certificate numbers and verification IDs for employers, schools, and sponsors.</p>
        </article>
      </div>

      <div className="certificate-workspace">
        <section className="certificate-panel">
          <div className="certificate-panel-header">
            <div>
              <span>{canIssue ? "All issued certificates" : "My certificates"}</span>
              <h3>{certificates.length} record{certificates.length !== 1 ? "s" : ""}</h3>
            </div>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          {loading ? (
            <div className="inline-loader">
              <Loader2 size={18} className="spin" />
              Loading certificates...
            </div>
          ) : certificates.length === 0 ? (
            <div className="empty-state">
              <Award size={38} />
              <strong>No certificates yet</strong>
              <p>{canIssue ? "Issue the first learner certificate." : "Your certificates will appear here after approval."}</p>
            </div>
          ) : (
            <div className="certificate-list">
              {certificates.map((certificate) => (
                <article className="certificate-item" key={certificate.id}>
                  <div>
                    <h3>{certificate.title}</h3>
                    <p>
                      {certificate.user?.fullName ?? "Learner"} <span>|</span> {formatDate(certificate.issuedAt)}
                    </p>
                  </div>
                  <div className="certificate-meta">
                    <span>{certificate.certificateNo}</span>
                    <code>{certificate.verificationId}</code>
                    <Link
                      className="certificate-verify-link"
                      to={`/verify/${certificate.verificationId}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open public verification page"
                    >
                      <ExternalLink size={13} />
                      Verify
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="certificate-panel">
          <div className="certificate-panel-header">
            <div>
              <span>Public lookup</span>
              <h3>Verify certificate</h3>
            </div>
          </div>

          <form className="certificate-verify-form" onSubmit={(event) => void handleVerify(event)}>
            <label>
              Verification ID
              <input
                value={verifyId}
                onChange={(event) => setVerifyId(event.target.value)}
                placeholder="Paste verification ID"
              />
            </label>
            <button className="primary-button" disabled={verifying || !verifyId.trim()}>
              {verifying ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              Verify
            </button>
          </form>

          {verifyError ? <p className="form-error">{verifyError}</p> : null}

          {verified ? (
            <article className="verified-certificate">
              <BadgeCheck size={24} />
              <div>
                <strong>{verified.title}</strong>
                <span>{verified.learner?.fullName ?? "Learner"}</span>
                <small>
                  {verified.certificateNo} | Issued {formatDate(verified.issuedAt)}
                </small>
              </div>
            </article>
          ) : null}
        </section>
      </div>

      {showIssueForm ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>Issue certificate</h2>
              <button
                className="payment-banner-close"
                aria-label="Close"
                onClick={() => setShowIssueForm(false)}
              >
                X
              </button>
            </div>
            <form className="modal-form" onSubmit={(event) => void handleIssue(event)}>
              <label>
                Learner
                <select
                  value={issueUserId}
                  onChange={(event) => setIssueUserId(event.target.value)}
                  required
                >
                  {users.length === 0 ? <option value="">No users loaded</option> : null}
                  {users.map((learner) => (
                    <option key={learner.id} value={learner.id}>
                      {learner.fullName} - {learner.email}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Certificate title
                <input
                  value={issueTitle}
                  onChange={(event) => setIssueTitle(event.target.value)}
                  placeholder="GIS 100 Completion Certificate"
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowIssueForm(false)}>
                  Cancel
                </button>
                <button className="primary-button" disabled={issuing || !issueUserId || !issueTitle.trim()}>
                  {issuing ? "Issuing..." : "Issue certificate"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
