import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Loader2,
  RadioTower,
  Save,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import TeamInvite from "../components/TeamInvite";
import TeamMembers from "../components/TeamMembers";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { competitionsApi } from "../lib/competitions-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import type {
  Competition,
  CompetitionParticipant,
  CompetitionStatus,
  CompetitionTeam,
} from "../types/competition";
import {
  COMPETITION_MODE_LABELS,
  COMPETITION_STATUS_COLOURS,
  COMPETITION_STATUS_LABELS,
} from "../types/competition";

const STATUS_FLOW: CompetitionStatus[] = ["DRAFT", "OPEN", "LIVE", "COMPLETED"];
const TEAM_MODES = new Set(["TEAM", "SCHOOL", "CORPORATE", "OLYMPIAD"]);

export function CompetitionDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isStaff = Boolean(user && (isAdminRole(user.role) || isInstructorRole(user.role)));

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<CompetitionParticipant[]>([]);
  const [teams, setTeams] = useState<CompetitionTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamCode, setNewTeamCode] = useState("");
  const [showMembersForTeam, setShowMembersForTeam] = useState<string | null>(null);

  // Inline edit
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError("");
    try {
      const [comp, board] = await Promise.all([
        competitionsApi.get(token, id),
        competitionsApi.getLeaderboard(token, id),
      ]);
      const teamList = TEAM_MODES.has(comp.mode) ? await competitionsApi.listTeams(token, id) : [];
      setCompetition(comp);
      setLeaderboard(board);
      setTeams(teamList);
      setEditForm({ title: comp.title, description: comp.description ?? "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load competition.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { void load(); }, [load]);

  async function advance() {
    if (!token || !id || !competition) return;
    const idx = STATUS_FLOW.indexOf(competition.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    setTransitioning(true);
    try {
      const updated = await competitionsApi.setStatus(token, id, STATUS_FLOW[idx + 1]);
      setCompetition(updated);
    } finally {
      setTransitioning(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setSaving(true);
    try {
      const updated = await competitionsApi.update(token, id, {
        title: editForm.title,
        description: editForm.description || undefined,
      });
      setCompetition(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function joinCompetition() {
    if (!token || !id || !competition) return;
    setJoining(true);
    setJoinError("");
    try {
      if (TEAM_MODES.has(competition.mode)) {
        const teamName = newTeamName.trim();
        if (!selectedTeamId && !teamName) {
          setJoinError("Choose a team or create a new one.");
          setJoining(false);
          return;
        }
        if (selectedTeamId) {
          await competitionsApi.join(token, id, {
            joinCode: competition.isPublic ? undefined : teamCode,
            teamId: selectedTeamId,
            teamCode,
          });
        } else {
          await competitionsApi.createTeam(token, id, {
            name: teamName,
            code: newTeamCode.trim() || undefined,
          });
        }
      } else {
        await competitionsApi.join(token, id, competition.isPublic ? undefined : teamCode);
      }
      setTeamCode("");
      setSelectedTeamId("");
      setNewTeamName("");
      setNewTeamCode("");
      await load();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not join competition.");
    } finally {
      setJoining(false);
    }
  }

  async function createTeamAndJoin() {
    if (!token || !id || !newTeamName.trim()) return;
    setJoining(true);
    setJoinError("");
    try {
      await competitionsApi.createTeam(token, id, {
        name: newTeamName.trim(),
        code: newTeamCode.trim() || undefined,
      });
      setNewTeamName("");
      setNewTeamCode("");
      await load();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not create team.");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return <div className="page-loading"><Loader2 size={22} className="spin" />Loading…</div>;
  }

  if (error || !competition) {
    return (
      <section className="module-page">
        <Link className="back-link" to="/competitions"><ArrowLeft size={16} />Back</Link>
        <p className="form-error">{error || "Not found."}</p>
      </section>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(competition.status);
  const canAdvance = isStaff && currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;
  const nextStatus = canAdvance ? STATUS_FLOW[currentIdx + 1] : null;
  const myEntry = leaderboard.find((e) => e.userId === user?.id);
  const isTeamCompetition = TEAM_MODES.has(competition.mode);
  const myTeam = teams.find((team) => team.members?.some((member) => member.userId === user?.id));

  return (
    <section className="module-page">
      <Link className="back-link" to="/competitions"><ArrowLeft size={16} />Back to competitions</Link>

      {/* ── Hero ── */}
      <div className="comp-detail-hero">
        <div className="comp-detail-hero-left">
          {editing ? (
            <form onSubmit={(e) => void saveEdit(e)} className="comp-edit-form">
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Description…"
              />
              <div className="comp-edit-actions">
                <button type="button" className="secondary-button small-button" onClick={() => setEditing(false)}>Cancel</button>
                <button className="primary-button small-button" disabled={saving}>
                  <Save size={14} />{saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="comp-detail-title">{competition.title}</h1>
              {competition.description && <p className="comp-detail-desc">{competition.description}</p>}
            </>
          )}

          <div className="comp-detail-chips">
            <span className={`assignment-badge ${COMPETITION_STATUS_COLOURS[competition.status]}`}>
              {competition.status === "LIVE" && <span className="live-dot-inline" />}
              {COMPETITION_STATUS_LABELS[competition.status]}
            </span>
            <span className="assignment-badge due">{COMPETITION_MODE_LABELS[competition.mode]}</span>
            <span className="assignment-badge score">{competition.durationMin} min</span>
            <span className="assignment-badge submissions">
              <Users size={11} />
              {competition._count?.participants ?? 0} participants
            </span>
            {isTeamCompetition && (
              <span className="assignment-badge submissions">
                <Users size={11} />
                {competition._count?.teams ?? teams.length} teams
              </span>
            )}
            {!competition.isPublic && (
              <span className="assignment-badge draft">🔒 Private · Code: {competition.joinCode}</span>
            )}
          </div>
        </div>

        {isStaff && (
          <div className="comp-detail-hero-actions">
            {!editing && (
              <button className="secondary-button small-button" onClick={() => setEditing(true)}>
                <Edit3 size={14} />Edit
              </button>
            )}
            {canAdvance && nextStatus && (
              <button
                className="primary-button small-button"
                disabled={transitioning}
                onClick={() => void advance()}
              >
                {transitioning ? <Loader2 size={14} className="spin" /> : <RadioTower size={14} />}
                Set {COMPETITION_STATUS_LABELS[nextStatus]}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Status stepper ── */}
      <div className="comp-status-stepper">
        {STATUS_FLOW.map((s, i) => (
          <div key={s} className={`status-step ${i <= currentIdx ? "status-step--done" : ""}`}>
            <div className="status-step-dot">
              {i < currentIdx ? <CheckCircle2 size={14} /> : i === currentIdx ? <RadioTower size={14} /> : null}
            </div>
            <span>{COMPETITION_STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {/* ── Student CTA ── */}
      {!isStaff && competition.status === "LIVE" && myEntry && (
        <div className="comp-student-cta">
          <div>
            <strong>The competition is live!</strong>
            <p>Your current score: <strong>{myEntry.score}</strong>{myEntry.rank ? ` · Rank #${myEntry.rank}` : ""}</p>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate(`/competitions/${competition.id}/challenge`)}
          >
            <RadioTower size={16} />Enter challenge
          </button>
        </div>
      )}

      {!isStaff && (competition.status === "OPEN" || competition.status === "LIVE") && !myEntry && (
        <div className="team-join-panel">
          <div>
            <strong>{isTeamCompetition ? "Join the battle with a team" : "Register for this competition"}</strong>
            <p>
              {isTeamCompetition
                ? "Pick an existing team or create yours before the competition starts."
                : "Registration is open. Join now to reserve your place."}
            </p>
          </div>

          {isTeamCompetition ? (
            <div className="team-join-grid">
              <label>
                Existing team
                <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
                  <option value="">Create a new team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team._count?.members ?? team.members?.length ?? 0})
                    </option>
                  ))}
                </select>
              </label>
              {!selectedTeamId && (
                <>
                  <label>
                    New team name
                    <input value={newTeamName} onChange={(event) => setNewTeamName(event.target.value)} placeholder="Team Lagos" />
                  </label>
                  <label>
                    Team code (optional)
                    <input value={newTeamCode} onChange={(event) => setNewTeamCode(event.target.value)} placeholder="For private team entry" />
                  </label>
                </>
              )}
              {selectedTeamId && (
                <label>
                  Team code
                  <input value={teamCode} onChange={(event) => setTeamCode(event.target.value)} placeholder="Only required for locked teams" />
                </label>
              )}
            </div>
          ) : !competition.isPublic ? (
            <label className="team-code-field">
              Join code
              <input value={teamCode} onChange={(event) => setTeamCode(event.target.value)} placeholder="Competition code" />
            </label>
          ) : null}

          {joinError ? <p className="form-error">{joinError}</p> : null}
          <div className="team-join-actions">
            <button className="primary-button" disabled={joining} onClick={() => void joinCompetition()}>
              {joining ? <Loader2 size={16} className="spin" /> : <Users size={16} />}
              {isTeamCompetition ? "Join competition" : "Register"}
            </button>
            {isTeamCompetition && !selectedTeamId && newTeamName.trim() && (
              <button className="secondary-button" disabled={joining} onClick={() => void createTeamAndJoin()}>
                Create team and join
              </button>
            )}
          </div>
        </div>
      )}

      {!isStaff && competition.status === "OPEN" && myEntry && (
        <div className="comp-student-cta">
          <p>
            You are registered{myTeam ? ` with ${myTeam.name}` : ""}. The competition will go live soon.
          </p>
        </div>
      )}

      {!isStaff && competition.status === "COMPLETED" && myEntry && (
        <div className="comp-student-cta comp-student-cta--done">
          <Trophy size={20} />
          <div>
            <strong>Final result</strong>
            <p>Score: {myEntry.score} · Final rank: #{myEntry.rank ?? "—"}</p>
          </div>
        </div>
      )}

      {/* ── Leaderboard ── */}
      <div className={isTeamCompetition ? "leaderboard-split" : ""}>
      {isTeamCompetition && (
        <div className="comp-leaderboard-section">
          <h2 className="comp-leaderboard-heading">
            <Users size={18} />Team leaderboard
          </h2>

          {teams.length === 0 ? (
            <p className="grading-empty">No teams yet.</p>
          ) : (
            <div className="comp-leaderboard">
              {teams.map((team, i) => {
                const isMine = team.id === myTeam?.id;

                return (
                  <div
                    key={team.id}
                    className={`comp-leader-row ${isMine ? "comp-leader-row--self" : ""} ${i < 3 ? "comp-leader-row--top" : ""}`}
                  >
                    <span className="comp-rank">#{team.rank ?? i + 1}</span>
                    <div className="user-avatar" aria-hidden="true">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="comp-leader-info">
                      <strong>{team.name}</strong>
                      <span>{team._count?.members ?? team.members?.length ?? 0} members</span>
                      {isMine && <span className="comp-you-badge">Your team</span>}
                    </div>
                    <span className="comp-leader-score">{team.score} pts</span>
                  </div>
                );
              })}
              {showMembersForTeam ? (
                <div style={{ marginTop: 12 }}>
                  <TeamMembers competitionId={competition.id} teamId={showMembersForTeam} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div className="comp-leaderboard-section">
        <h2 className="comp-leaderboard-heading">
          <Trophy size={18} />Individual leaderboard
        </h2>

        {leaderboard.length === 0 ? (
          <p className="grading-empty">No participants yet.</p>
        ) : (
          <div className="comp-leaderboard">
            {leaderboard.map((entry, i) => {
              const isSelf = entry.userId === user?.id;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

              return (
                <div
                  key={entry.id}
                  className={`comp-leader-row ${isSelf ? "comp-leader-row--self" : ""} ${i < 3 ? "comp-leader-row--top" : ""}`}
                >
                  <span className="comp-rank">
                    {medal ?? `#${entry.rank ?? i + 1}`}
                  </span>
                  <div className="user-avatar" aria-hidden="true">
                    {(entry.user?.fullName ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="comp-leader-info">
                    <strong>{entry.user?.fullName ?? "Unknown"}</strong>
                    {entry.team ? <span>{entry.team.name}</span> : null}
                    {isSelf && <span className="comp-you-badge">You</span>}
                  </div>
                  <span className="comp-leader-score">{entry.score} pts</span>
                  {isSelf ? <CheckCircle2 size={15} className="comp-self-check" /> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </section>
  );
}
