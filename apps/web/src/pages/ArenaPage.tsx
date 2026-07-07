import {
  Clock,
  Loader2,
  PlusCircle,
  RadioTower,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { competitionsApi } from "../lib/competitions-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type { Competition, CreateCompetitionPayload, MyParticipation } from "../types/competition";
import {
  COMPETITION_MODE_LABELS,
  COMPETITION_STATUS_LABELS,
} from "../types/competition";

// ─── Mode config ─────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<
  string,
  { icon: typeof Swords; gradient: string; accent: string }
> = {
  INDIVIDUAL:     { icon: Swords,      gradient: "linear-gradient(135deg,#0c3326,#146b4a)", accent: "#1fa66a" },
  HEAD_TO_HEAD:   { icon: Swords,      gradient: "linear-gradient(135deg,#1e1b4b,#4338ca)", accent: "#818cf8" },
  TEAM:           { icon: Users,       gradient: "linear-gradient(135deg,#1c1917,#78350f)", accent: "#f59e0b" },
  LIVE_TIMED:     { icon: RadioTower,  gradient: "linear-gradient(135deg,#450a0a,#dc2626)", accent: "#fca5a5" },
  OLYMPIAD:       { icon: Trophy,      gradient: "linear-gradient(135deg,#713f12,#d97706)", accent: "#fde68a" },
  SCHOOL:         { icon: Users,       gradient: "linear-gradient(135deg,#0c4a6e,#0284c7)", accent: "#7dd3fc" },
  CORPORATE:      { icon: Users,       gradient: "linear-gradient(135deg,#1e1b4b,#7c3aed)", accent: "#c4b5fd" },
  OPEN_CHALLENGE: { icon: RadioTower,  gradient: "linear-gradient(135deg,#064e3b,#059669)", accent: "#6ee7b7" },
};

const TEAM_MODES = new Set(["TEAM", "SCHOOL", "CORPORATE", "OLYMPIAD"]);

// ─── Mode showcase card ───────────────────────────────────────────────────────

function ModeShowcaseCard({ mode }: { mode: keyof typeof MODE_CONFIG }) {
  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.INDIVIDUAL;
  const Icon = cfg.icon;
  const descriptions: Record<string, string> = {
    INDIVIDUAL:   "Solo timed challenge at your own pace.",
    HEAD_TO_HEAD: "Challenge any opponent head-to-head.",
    LIVE_TIMED:   "Everyone starts at the same moment.",
    OLYMPIAD:     "Regional and national ranking events.",
  };
  return (
    <article className="mode-showcase-card" style={{ "--mode-gradient": cfg.gradient, "--mode-accent": cfg.accent } as React.CSSProperties}>
      <div className="mode-showcase-icon">
        <Icon size={22} />
      </div>
      <strong>{COMPETITION_MODE_LABELS[mode]}</strong>
      <span>{descriptions[mode]}</span>
    </article>
  );
}

// ─── Lobby competition card ───────────────────────────────────────────────────

function LobbyCard({
  comp,
  joined,
  myRank,
  isStaff,
  joining,
  joiningId,
  onJoin,
}: {
  comp: Competition;
  joined: boolean;
  myRank?: number;
  isStaff: boolean;
  joining: boolean;
  joiningId: string | null;
  onJoin: (id: string, isPublic: boolean) => void;
}) {
  const cfg = MODE_CONFIG[comp.mode] ?? MODE_CONFIG.INDIVIDUAL;
  const Icon = cfg.icon;
  const isLive = comp.status === "LIVE";
  const isOpen = comp.status === "OPEN";
  const participants = comp._count?.participants ?? 0;
  const isBusy = joining && joiningId === comp.id;

  return (
    <article className={`lobby-card-v2${isLive ? " lobby-card-v2--live" : ""}`}>
      {/* Gradient header stripe */}
      <div
        className="lobby-card-v2-stripe"
        style={{ background: cfg.gradient }}
        aria-hidden="true"
      >
        <div className="lobby-card-v2-stripe-icon">
          <Icon size={20} />
        </div>
        {isLive && (
          <div className="lobby-card-v2-live-badge">
            <span className="live-dot-inline" />
            Live now
          </div>
        )}
        {isOpen && (
          <div className="lobby-card-v2-open-badge">
            Registering
          </div>
        )}
        {comp.status === "COMPLETED" && (
          <div className="lobby-card-v2-done-badge">Ended</div>
        )}
      </div>

      {/* Body */}
      <div className="lobby-card-v2-body">
        <div className="lobby-card-v2-top">
          <span className="lobby-card-v2-mode">{COMPETITION_MODE_LABELS[comp.mode]}</span>
          {myRank && (
            <span className="lobby-card-v2-rank">#{myRank}</span>
          )}
        </div>

        <h3 className="lobby-card-v2-title">{comp.title}</h3>

        {comp.description && (
          <p className="lobby-card-v2-desc">{comp.description}</p>
        )}

        <div className="lobby-card-v2-meta">
          <span>
            <Clock size={12} />
            {comp.durationMin} min
          </span>
          <span>
            <Users size={12} />
            {participants.toLocaleString()} joined
          </span>
          {comp.maxParticipants && (
            <span>Max {comp.maxParticipants}</span>
          )}
          {!comp.isPublic && <span>🔒 Private</span>}
        </div>

        {/* Player count bar */}
        {comp.maxParticipants && comp.maxParticipants > 0 && (
          <div className="lobby-card-v2-fill-track">
            <div
              className="lobby-card-v2-fill-bar"
              style={{
                width: `${Math.min(100, (participants / comp.maxParticipants) * 100)}%`,
                background: cfg.accent,
              }}
            />
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="lobby-card-v2-footer">
        {isStaff ? (
          <Link className="lobby-card-v2-cta lobby-card-v2-cta--ghost" to={`/arena/${comp.id}`}>
            Manage
          </Link>
        ) : joined ? (
          <Link
            className={`lobby-card-v2-cta${isLive ? " lobby-card-v2-cta--live" : " lobby-card-v2-cta--ghost"}`}
            style={isLive ? { background: cfg.gradient } : undefined}
            to={`/arena/${comp.id}`}
          >
            {isLive ? (
              <><Zap size={14} /> Enter now</>
            ) : (
              "View"
            )}
          </Link>
        ) : (isOpen || isLive) && TEAM_MODES.has(comp.mode) ? (
          <Link
            className="lobby-card-v2-cta"
            style={{ background: cfg.gradient }}
            to={`/arena/${comp.id}`}
          >
            <Users size={14} /> Choose team
          </Link>
        ) : (isOpen || isLive) ? (
          <button
            className="lobby-card-v2-cta"
            style={{ background: cfg.gradient }}
            disabled={isBusy}
            onClick={() => onJoin(comp.id, comp.isPublic)}
            type="button"
          >
            {isBusy ? <Loader2 size={13} className="spin" /> : <Zap size={14} />}
            {isBusy ? "Joining…" : "Join"}
          </button>
        ) : (
          <Link className="lobby-card-v2-cta lobby-card-v2-cta--ghost" to={`/arena/${comp.id}`}>
            View results
          </Link>
        )}
      </div>
    </article>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ArenaPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isStaff = Boolean(user && (isAdminRole(user.role) || isInstructorRole(user.role)));

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [mine, setMine] = useState<MyParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<CreateCompetitionPayload>>({
    mode: "INDIVIDUAL", durationMin: 30, isPublic: true,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [comps, participations] = await Promise.all([
        competitionsApi.list(token, isStaff),
        competitionsApi.getMyParticipations(token),
      ]);
      setCompetitions(comps);
      setMine(participations);
    } catch {
      setError("Could not load competitions.");
    } finally {
      setLoading(false);
    }
  }, [token, isStaff]);

  useEffect(() => { void load(); }, [load]);

  const joinedIds = new Set(mine.map((m) => m.competitionId));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !createForm.title || !createForm.mode) return;
    setCreating(true);
    setCreateError("");
    try {
      const created = await competitionsApi.create(token, {
        title: createForm.title,
        description: createForm.description,
        mode: createForm.mode,
        durationMin: createForm.durationMin ?? 30,
        isPublic: createForm.isPublic ?? true,
        joinCode: createForm.joinCode,
        maxParticipants: createForm.maxParticipants,
        assessmentId: createForm.assessmentId,
      });
      setShowCreate(false);
      navigate(`/arena/${created.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setCreating(false);
    }
  }

  function handleJoin(id: string, isPublic: boolean) {
    if (!token) return;
    if (!isPublic) { setJoiningId(id); setJoinCode(""); setJoinError(""); return; }
    void doJoin(id, undefined);
  }

  async function doJoin(id: string, code?: string) {
    if (!token) return;
    setJoining(true);
    setJoinError("");
    try {
      await competitionsApi.join(token, id, code);
      setJoiningId(null);
      navigate(`/arena/${id}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not join.");
    } finally {
      setJoining(false);
    }
  }

  // Split comps by status for better UX grouping
  const live  = competitions.filter((c) => c.status === "LIVE");
  const open  = competitions.filter((c) => c.status === "OPEN");
  const other = competitions.filter((c) => c.status !== "LIVE" && c.status !== "OPEN");

  return (
    <section className="module-page">
      {/* Header */}
      <SectionHeading
        eyebrow="Competition arena"
        title="Live battles & Olympiad contests"
        action={
          isStaff ? (
            <button className="primary-button small-button" onClick={() => setShowCreate(true)}>
              <PlusCircle size={15} /> New competition
            </button>
          ) : undefined
        }
      />

      {/* Mode showcase */}
      <div className="mode-showcase-grid">
        {(["INDIVIDUAL", "HEAD_TO_HEAD", "LIVE_TIMED", "OLYMPIAD"] as const).map((m) => (
          <ModeShowcaseCard key={m} mode={m} />
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="page-loading">
          <Loader2 size={22} className="spin" /> Loading arena…
        </div>
      ) : competitions.length === 0 ? (
        <div className="empty-state">
          <Trophy size={40} />
          <strong>No competitions open</strong>
          <p>{isStaff ? "Create the first competition." : "Check back soon for live challenges."}</p>
          {isStaff && (
            <button className="primary-button" onClick={() => setShowCreate(true)}>
              <PlusCircle size={16} /> New competition
            </button>
          )}
        </div>
      ) : (
        <div className="arena-lobby-sections">
          {/* Live */}
          {live.length > 0 && (
            <div className="arena-lobby-section">
              <div className="arena-section-label arena-section-label--live">
                <span className="live-dot-inline" /> Live now — {live.length} active
              </div>
              <div className="lobby-cards-grid">
                {live.map((comp) => (
                  <LobbyCard
                    key={comp.id} comp={comp}
                    joined={joinedIds.has(comp.id)}
                    myRank={mine.find((m) => m.competitionId === comp.id)?.rank ?? undefined}
                    isStaff={isStaff} joining={joining} joiningId={joiningId}
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Open */}
          {open.length > 0 && (
            <div className="arena-lobby-section">
              <div className="arena-section-label">
                Registering now — {open.length} open
              </div>
              <div className="lobby-cards-grid">
                {open.map((comp) => (
                  <LobbyCard
                    key={comp.id} comp={comp}
                    joined={joinedIds.has(comp.id)}
                    myRank={mine.find((m) => m.competitionId === comp.id)?.rank ?? undefined}
                    isStaff={isStaff} joining={joining} joiningId={joiningId}
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other */}
          {other.length > 0 && (
            <div className="arena-lobby-section">
              <div className="arena-section-label">Other</div>
              <div className="lobby-cards-grid">
                {other.map((comp) => (
                  <LobbyCard
                    key={comp.id} comp={comp}
                    joined={joinedIds.has(comp.id)}
                    myRank={mine.find((m) => m.competitionId === comp.id)?.rank ?? undefined}
                    isStaff={isStaff} joining={joining} joiningId={joiningId}
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Private join code modal ── */}
      {joiningId && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="join-modal-title">
          <section className="modal-panel">
            <div className="modal-header">
              <h2 id="join-modal-title">Enter join code</h2>
              <button className="payment-banner-close" onClick={() => setJoiningId(null)}>×</button>
            </div>
            <div className="modal-form">
              <label>
                Join code
                <input autoFocus value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="e.g. ARENA2026" />
              </label>
              {joinError && <p className="form-error">{joinError}</p>}
              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setJoiningId(null)}>Cancel</button>
                <button className="primary-button" disabled={joining || !joinCode} onClick={() => void doJoin(joiningId, joinCode)}>
                  {joining ? "Joining…" : "Join"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Create competition modal ── */}
      {showCreate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
          <section className="modal-panel">
            <div className="modal-header">
              <h2 id="create-modal-title">New competition</h2>
              <button className="payment-banner-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={(e) => void handleCreate(e)}>
              <label>Title<input required minLength={3} value={createForm.title ?? ""} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} /></label>
              <label>Description<textarea rows={2} value={createForm.description ?? ""} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} /></label>
              <label>Mode
                <select value={createForm.mode} onChange={(e) => setCreateForm({ ...createForm, mode: e.target.value as CreateCompetitionPayload["mode"] })}>
                  {(Object.keys(COMPETITION_MODE_LABELS) as Array<keyof typeof COMPETITION_MODE_LABELS>).map((m) => (
                    <option key={m} value={m}>{COMPETITION_MODE_LABELS[m]}</option>
                  ))}
                </select>
              </label>
              <label>Duration (minutes)<input type="number" min={1} max={600} value={createForm.durationMin ?? 30} onChange={(e) => setCreateForm({ ...createForm, durationMin: Number(e.target.value) })} /></label>
              <label>Max participants (optional)<input type="number" min={2} value={createForm.maxParticipants ?? ""} onChange={(e) => setCreateForm({ ...createForm, maxParticipants: e.target.value ? Number(e.target.value) : undefined })} placeholder="Unlimited" /></label>
              <label className="checkbox-label">
                <input type="checkbox" checked={createForm.isPublic ?? true} onChange={(e) => setCreateForm({ ...createForm, isPublic: e.target.checked })} />
                Public (anyone can join)
              </label>
              {!createForm.isPublic && (
                <label>Join code<input value={createForm.joinCode ?? ""} onChange={(e) => setCreateForm({ ...createForm, joinCode: e.target.value })} placeholder="e.g. ARENA2026" /></label>
              )}
              {createError && <p className="form-error">{createError}</p>}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="primary-button" disabled={creating}>{creating ? "Creating…" : "Create"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
