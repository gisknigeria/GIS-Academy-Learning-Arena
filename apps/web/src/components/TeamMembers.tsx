import React, { useEffect, useState } from "react";
import axios from "axios";

type Member = {
  id: string;
  fullName?: string;
  email?: string;
  joinedAt?: string;
};

export default function TeamMembers({ competitionId, teamId, apiBase }: { competitionId: string; teamId: string; apiBase?: string }) {
  const base = apiBase ?? (import.meta.env.VITE_API_BASE_URL as string) ?? "";
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!competitionId || !teamId) return;
    const fetch = async () => {
      const res = await axios.get(`${base}/api/competitions/${competitionId}/teams/${teamId}/members`);
      // teamInclude returns members under `members` array
      const m = res.data.members?.map((it: any) => ({ id: it.user?.id, fullName: it.user?.fullName, email: it.user?.email, joinedAt: it.joinedAt }));
      setMembers(m || []);
    };
    fetch();
  }, [competitionId, teamId]);

  return (
    <div className="team-members">
      <h4>Team Members</h4>
      <ul>
        {members.map((m) => (
          <li key={m.id}>
            <strong>{m.fullName}</strong> <span style={{ color: "#666" }}>({m.email})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
