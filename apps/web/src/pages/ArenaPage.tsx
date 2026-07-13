import {
  Loader2,
  PlusCircle,
  RadioTower,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { competitionsApi } from "../lib/competitions-api";
import { isAdminRole } from "../lib/roles";
import type { Competition, CreateCompetitionPayload, MyParticipation } from "../types/competition";
import {
  COMPETITION_MODE_LABELS,
  COMPETITION_STATUS_COLOURS,
  COMPETITION_STATUS_LABELS,
} from "../types/competition";

const MODE_ICONS = {
  HEAD_TO_HEAD: Swords,
  TEAM: Users,
  LIVE_TIMED: RadioTower,
  OLYMPIAD: Trophy,
  INDIVIDUAL: Swords,
  SCHOOL: Users,
  CORPORATE: Users,
  OPEN_CHALLENGE: RadioTower,
};
const TEAM_MODES = new Set(["TEAM", "SCHOOL", "CORPORATE", "OLYMPIAD"]);

export function ArenaPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isStaff = Boolean(user && isAdminRole(user.role));

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [mine, setMine] = useState<MyParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<CreateCompetitionPayload>>({
    mode: "INDIVIDUAL",
    durationMin: 30,
    isPublic: true,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Join modal
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

  // Derive joined set for quick lookup
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
      navigate(`/competitions/${created.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(id: string, isPublic: boolean) {
    if (!token) return;
    if (!isPublic && !joiningId) {
      setJoiningId(id);
      setJoinCode("");
      setJoinError("");
      return;
    }

    setJoining(true);
    setJoinError("");
    try {
      await competitionsApi.join(token, id, isPublic ? undefined : joinCode);
      setJoiningId(null);
      navigate(`/competitions/${id}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not join.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <section className="module-page">
      <SectionHeading
        eyebrow="Knowledge Hub challenges"
        title="Live competitions and skill contests"
        action={
          isStaff ? (
            <button className="primary-button small-button" onClick={() => setShowCreate(true)}>
              <PlusCircle size={15} />New competition
            </button>
          ) : undefined
        }
      />

      {/* Mode showcase chips */}
      <div className="mode-grid">
        {(["INDIVIDUAL", "HEAD_TO_HEAD", "LIVE_TIMED", "OLYMPIAD"] as const).map((m) => {
          const Icon = MODE_ICONS[m];
          return (
            <article key={m} className="mode-card">
              <Icon size={24} />
              <strong>{COMPETITION_MODE_LABELS[m]}</strong>
              <span>{m === "INDIVIDUAL" ? "Solo timed challenge." : m === "HEAD_TO_HEAD" ? "Challenge anyone online." : m === "LIVE_TIMED" ? "Everyone starts together." : "Regional and national ranking."}</span>
            </article>
          );
        })}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? (
        <div className="page-loading"><Loader2 size={22} className="spin" />Loading challenges...</div>
      ) : (
        <div className="workstream">
          <SectionHeading eyebrow="Open now" title="Challenge lobby" compact />

          {competitions.length === 0 ? (
            <div className="empty-state">
              <Trophy size={40} />
              <strong>No competitions open</strong>
              <p>{isStaff ? "Create the first competition." : "Check back soon for live challenges."}</p>
              {isStaff && (
                <button className="primary-button" onClick={() => setShowCreate(true)}>
                  <PlusCircle size={16} />New competition
                </button>
              )}
            </div>
          ) : (
            <div className="competition-lobby-list">
              {competitions.map((comp) => {
                const Icon = MODE_ICONS[comp.mode] ?? Swords;
                const joined = joinedIds.has(comp.id);
                const myEntry = mine.find((m) => m.competitionId === comp.id);

                return (
                  <article key={comp.id} className="lobby-card">
                    <div className="lobby-card-left">
                      <div className="lobby-mode-icon">
                        <Icon size={20} />
                      </div>
                      <div className="lobby-card-body">
                        <div className="lobby-card-top">
                          <h3>{comp.title}</h3>
                          <span className={`assignment-badge ${COMPETITION_STATUS_COLOURS[comp.status]}`}>
                            {comp.status === "LIVE" && <span className="live-dot-inline" />}
                            {COMPETITION_STATUS_LABELS[comp.status]}
                          </span>
                        </div>
                        {comp.description ? (
                          <p className="lobby-card-desc">{comp.description}</p>
                        ) : null}
                        <div className="lobby-card-meta">
                          <span>{COMPETITION_MODE_LABELS[comp.mode]}</span>
                          <span>{comp.durationMin} min</span>
                          <span>{comp._count?.participants ?? 0} joined</span>
                          {comp.maxParticipants && (
                            <span>Max {comp.maxParticipants}</span>
                          )}
                          {!comp.isPublic && <span>🔒 Private</span>}
                          {myEntry?.rank && <span>Your rank: #{myEntry.rank}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="lobby-card-actions">
                      {isStaff ? (
                        <Link className="secondary-button small-button" to={`/competitions/${comp.id}`}>
                          Manage
                        </Link>
                      ) : joined ? (
                        <Link
                          className={comp.status === "LIVE" ? "primary-button small-button" : "secondary-button small-button"}
                          to={`/competitions/${comp.id}`}
                        >
                          {comp.status === "LIVE" ? "Enter" : "View"}
                        </Link>
                      ) : (comp.status === "OPEN" || comp.status === "LIVE") && TEAM_MODES.has(comp.mode) ? (
                        <Link className="primary-button small-button" to={`/competitions/${comp.id}`}>
                          Choose team
                        </Link>
                      ) : comp.status === "OPEN" || comp.status === "LIVE" ? (
                        <button
                          className="primary-button small-button"
                          onClick={() => void handleJoin(comp.id, comp.isPublic)}
                          disabled={joining && joiningId === comp.id}
                        >
                          {joining && joiningId === comp.id ? <Loader2 size={13} className="spin" /> : null}
                          Join
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Private join code modal ── */}
      {joiningId && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>Enter join code</h2>
              <button className="payment-banner-close" onClick={() => setJoiningId(null)}>×</button>
            </div>
            <div className="modal-form">
              <label>
                Join code
                <input
                  autoFocus
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter the competition code"
                />
              </label>
              {joinError ? <p className="form-error">{joinError}</p> : null}
              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setJoiningId(null)}>Cancel</button>
                <button
                  className="primary-button"
                  disabled={joining || !joinCode}
                  onClick={() => void handleJoin(joiningId, false)}
                >
                  {joining ? "Joining…" : "Join"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Create competition modal ── */}
      {showCreate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>New competition</h2>
              <button className="payment-banner-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={(e) => void handleCreate(e)}>
              <label>
                Title
                <input
                  required minLength={3}
                  value={createForm.title ?? ""}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </label>
              <label>
                Description
                <textarea
                  rows={2}
                  value={createForm.description ?? ""}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </label>
              <label>
                Mode
                <select
                  value={createForm.mode}
                  onChange={(e) => setCreateForm({ ...createForm, mode: e.target.value as CreateCompetitionPayload["mode"] })}
                >
                  {(Object.keys(COMPETITION_MODE_LABELS) as Array<keyof typeof COMPETITION_MODE_LABELS>).map((m) => (
                    <option key={m} value={m}>{COMPETITION_MODE_LABELS[m]}</option>
                  ))}
                </select>
              </label>
              <label>
                Duration (minutes)
                <input type="number" min={1} max={600}
                  value={createForm.durationMin ?? 30}
                  onChange={(e) => setCreateForm({ ...createForm, durationMin: Number(e.target.value) })}
                />
              </label>
              <label>
                Max participants (optional)
                <input type="number" min={2}
                  value={createForm.maxParticipants ?? ""}
                  onChange={(e) => setCreateForm({ ...createForm, maxParticipants: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Unlimited"
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={createForm.isPublic ?? true}
                  onChange={(e) => setCreateForm({ ...createForm, isPublic: e.target.checked })}
                />
                Public (anyone can join)
              </label>
              {!createForm.isPublic && (
                <label>
                  Join code
                  <input
                    value={createForm.joinCode ?? ""}
                    onChange={(e) => setCreateForm({ ...createForm, joinCode: e.target.value })}
                    placeholder="e.g. ARENA2026"
                  />
                </label>
              )}
              {createError ? <p className="form-error">{createError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="primary-button" disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
