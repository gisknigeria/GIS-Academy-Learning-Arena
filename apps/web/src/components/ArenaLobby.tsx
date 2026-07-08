/**
 * ArenaLobby
 *
 * Improved competition lobby card for the dashboard:
 * - Live competitions from API with real-time-style animated player counts
 * - Matchmaking pulsing UI for LIVE competitions
 * - Countdown to start for OPEN competitions
 * - Static fallback when no API data is available
 */

import { Clock, RadioTower, Sparkles, Swords, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Competition } from "../types/competition";
import {
  COMPETITION_MODE_LABELS,
  COMPETITION_STATUS_COLOURS,
  COMPETITION_STATUS_LABELS,
} from "../types/competition";

// ─── Types ────────────────────────────────────────────────────────────────────

type StaticCompetition = {
  name: string;
  type: string;
  status: string;
  players: number;
};

type ArenaLobbyProps = {
  liveCompetitions?: Competition[];
  competitions?: StaticCompetition[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCountdown(target: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    const end = new Date(target).getTime();

    function tick() {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Starting…");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`,
      );
    }

    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [target]);

  return timeLeft;
}

// ─── Single live competition row ──────────────────────────────────────────────

function LiveCompetitionRow({ comp }: { comp: Competition }) {
  const countdown = useCountdown(comp.status === "OPEN" ? comp.startsAt : null);
  const isLive = comp.status === "LIVE";
  const isOpen = comp.status === "OPEN";
  const participants = comp._count?.participants ?? 0;

  const Icon =
    comp.mode === "HEAD_TO_HEAD" ? Swords :
    comp.mode === "OLYMPIAD" ? Trophy :
    comp.mode === "LIVE_TIMED" ? RadioTower :
    Users;

  return (
    <article className={`arena-lobby-row ${isLive ? "arena-lobby-row--live" : ""}`}>
      <div className="arena-lobby-row-icon">
        <Icon size={18} />
      </div>

      <div className="arena-lobby-row-body">
        <div className="arena-lobby-row-top">
          <strong>{comp.title}</strong>
          <span className={`assignment-badge ${COMPETITION_STATUS_COLOURS[comp.status]}`}>
            {isLive && <span className="live-dot-inline" />}
            {COMPETITION_STATUS_LABELS[comp.status]}
          </span>
        </div>
        <div className="arena-lobby-row-meta">
          <span>
            <Users size={11} />
            {participants} {participants === 1 ? "player" : "players"}
          </span>
          <span>{COMPETITION_MODE_LABELS[comp.mode]}</span>
          <span>{comp.durationMin} min</span>
          {isOpen && countdown && (
            <span className="arena-lobby-countdown">
              <Clock size={11} />
              {countdown}
            </span>
          )}
        </div>

        {/* Matchmaking waiting bar — pulsing when live */}
        {isLive && (
          <div className="arena-matchmaking-bar" aria-label="Live battle in progress">
            <span className="arena-matchmaking-dot" />
            <span className="arena-matchmaking-dot" style={{ animationDelay: "0.15s" }} />
            <span className="arena-matchmaking-dot" style={{ animationDelay: "0.3s" }} />
            <span className="arena-matchmaking-text">Battle live • Matchmaking active</span>
          </div>
        )}
        {isOpen && (
          <>
            <div className="arena-waiting-bar">
              <div
                className="arena-waiting-fill"
                style={{
                  width: comp.maxParticipants
                    ? `${Math.min(100, (participants / comp.maxParticipants) * 100)}%`
                    : "60%",
                }}
              />
            </div>
            <div className="arena-waiting-room">
              <span><Sparkles size={11} /> Waiting room</span>
              <span>{Math.max(0, (comp.maxParticipants ?? 12) - participants)} spots left</span>
            </div>
          </>
        )}
      </div>

      <div className="arena-lobby-row-action">
        <Link
          className={isLive ? "primary-button small-button" : "secondary-button small-button"}
          to={`/arena/${comp.id}`}
        >
          {isLive ? "Enter" : "View"}
        </Link>
      </div>
    </article>
  );
}

// ─── Static row ───────────────────────────────────────────────────────────────

function StaticCompetitionRow({ comp }: { comp: StaticCompetition }) {
  return (
    <article className="arena-lobby-row arena-lobby-row--preview">
      <div className="arena-lobby-row-icon">
        <Swords size={18} />
      </div>
      <div className="arena-lobby-row-body">
        <div className="arena-lobby-row-top">
          <strong>{comp.name}</strong>
          <span className="assignment-badge draft">{comp.status}</span>
        </div>
        <div className="arena-lobby-row-meta">
          <span><Users size={11} />{comp.players} players</span>
          <span>{comp.type}</span>
        </div>
        <div className="arena-waiting-room arena-waiting-room--preview">
          <span><Sparkles size={11} /> Matchmaking ready</span>
          <span>Join when the lobby opens</span>
        </div>
      </div>
      <div className="arena-lobby-row-action">
        <Link className="secondary-button small-button" to="/arena">View</Link>
      </div>
    </article>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function ArenaLobby({ liveCompetitions, competitions }: ArenaLobbyProps) {
  const hasLive = Boolean(liveCompetitions && liveCompetitions.length > 0);

  const lobbyBody = hasLive ? (
    <div className="arena-lobby-list">
      {liveCompetitions!.map((comp) => (
        <LiveCompetitionRow key={comp.id} comp={comp} />
      ))}
      <Link className="arena-lobby-view-all" to="/arena">
        View all competitions →
      </Link>
    </div>
  ) : (
    <div className="arena-lobby-list">
      {(competitions ?? []).map((comp) => (
        <StaticCompetitionRow key={comp.name} comp={comp} />
      ))}
      <Link className="arena-lobby-view-all" to="/arena">
        View all competitions →
      </Link>
    </div>
  );

  return (
    <div className="arena-lobby-shell">
      <div className="arena-lobby-heading">
        <div>
          <p className="eyebrow">Arena lobby</p>
          <h3>GIS competitions with instant feedback</h3>
        </div>
        <span className={`arena-lobby-status ${hasLive ? "arena-lobby-status--live" : ""}`}>
          {hasLive ? <><RadioTower size={14} /> Live now</> : <><Sparkles size={14} /> Matchmaking ready</>}
        </span>
      </div>
      {lobbyBody}
    </div>
  );
}
