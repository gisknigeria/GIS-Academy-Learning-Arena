import { Link } from "react-router-dom";
import type { Competition } from "../types/competition";
import { COMPETITION_MODE_LABELS, COMPETITION_STATUS_COLOURS, COMPETITION_STATUS_LABELS } from "../types/competition";

type StaticCompetition = {
  name: string;
  type: string;
  status: string;
  players: number;
};

type ArenaLobbyProps = {
  /** Live Competition objects from the API */
  liveCompetitions?: Competition[];
  /** Legacy static mock data for dashboard placeholders */
  competitions?: StaticCompetition[];
};

export function ArenaLobby({ liveCompetitions, competitions }: ArenaLobbyProps) {
  // Use live data if provided, otherwise fall back to static mock
  if (liveCompetitions && liveCompetitions.length > 0) {
    return (
      <div className="competition-list">
        {liveCompetitions.map((comp) => (
          <article className="competition" key={comp.id}>
            <div>
              <h3>{comp.title}</h3>
              <p>{COMPETITION_MODE_LABELS[comp.mode]}</p>
            </div>
            <span className={`assignment-badge ${COMPETITION_STATUS_COLOURS[comp.status]}`} style={{ fontSize: "0.75rem" }}>
              {COMPETITION_STATUS_LABELS[comp.status]}
            </span>
            <strong>{comp._count?.participants ?? 0} joined</strong>
            <Link className="secondary-button small-button" to={`/arena/${comp.id}`}>
              View
            </Link>
          </article>
        ))}
      </div>
    );
  }

  // Static fallback
  return (
    <div className="competition-list">
      {(competitions ?? []).map((competition) => (
        <article className="competition" key={competition.name}>
          <div>
            <h3>{competition.name}</h3>
            <p>{competition.type}</p>
          </div>
          <span>{competition.status}</span>
          <strong>{competition.players} joined</strong>
        </article>
      ))}
    </div>
  );
}
