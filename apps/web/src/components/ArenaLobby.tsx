type Competition = {
  name: string;
  type: string;
  status: string;
  players: number;
};

type ArenaLobbyProps = {
  competitions: Competition[];
};

export function ArenaLobby({ competitions }: ArenaLobbyProps) {
  return (
    <div className="competition-list">
      {competitions.map((competition) => (
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
