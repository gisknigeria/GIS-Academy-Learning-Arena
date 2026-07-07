import React, { useState } from "react";
import axios from "axios";

export default function TeamInvite({ competitionId, teamId, token, apiBase }: { competitionId: string; teamId: string; token?: string; apiBase?: string }) {
  const base = apiBase ?? (import.meta.env.VITE_API_BASE_URL as string) ?? "";
  const [inviteUrl, setInviteUrl] = useState<string | null>(token ? `${base}/api/competitions/invitations/${token}/join` : null);
  const [expiresHours, setExpiresHours] = useState<number>(24);
  const [newToken, setNewToken] = useState<string | null>(null);

  const createInvite = async () => {
    const res = await axios.post(`${base}/api/competitions/${competitionId}/teams/${teamId}/invite`, { expiresHours });
    setNewToken(res.data.token);
    setInviteUrl(`${apiBase ?? ""}/api/competitions/invitations/${res.data.token}/join`);
  };

  return (
    <div className="team-invite">
      <h4>Team Invite</h4>
      {inviteUrl ? (
        <div>
          <input readOnly value={inviteUrl} style={{ width: "100%" }} />
        </div>
      ) : (
        <div>
          <label>Expires (hours)</label>
          <input type="number" value={expiresHours} onChange={(e) => setExpiresHours(Number(e.target.value))} />
          <button onClick={createInvite}>Create Invite Link</button>
        </div>
      )}
    </div>
  );
}
