import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import assessmentsApi from "../lib/assessments-api";
import { SectionHeading } from "../components/SectionHeading";

export default function QuestionBankPage() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bankId, setBankId] = useState("");
  const [drawn, setDrawn] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void assessmentsApi.listBanks(token).then(setBanks).catch(() => {});
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await assessmentsApi.createBank(token, title, description);
      setMessage(`Bank created: ${res.id}`);
      setBankId(res.id);
      setTitle("");
      setDescription("");
      const list = await assessmentsApi.listBanks(token);
      setBanks(list);
    } catch (err) {
      setMessage("Failed to create bank");
    }
  }

  async function handleDraw(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !bankId) return;
    try {
      const items = await assessmentsApi.drawFromBank(token, bankId, 10);
      setDrawn(items);
      setMessage(null);
    } catch (err) {
      setMessage("Draw failed");
    }
  }

  return (
    <div>
      <SectionHeading eyebrow="Question banks" title="Manage question banks" />

      <section className="content-grid">
        <div className="workstream">
          <div className="admin-card admin-card-summary">
            <div className="admin-card-header">
              <h3>Create bank</h3>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 12 }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bank title" required style={{ width: "100%", marginBottom: 8 }} />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ width: "100%", marginBottom: 8 }} />
              <button className="primary-button" type="submit">Create bank</button>
            </form>
            {message && <p style={{ padding: 12 }}>{message}</p>}
          </div>

          <div className="admin-card admin-card-summary">
            <div className="admin-card-header">
              <h3>Existing banks</h3>
            </div>
            <div style={{ padding: 12 }}>
              {banks.length === 0 ? (
                <p>No banks yet. Create one to begin.</p>
              ) : (
                <ul className="admin-list">
                  {banks.map((bank) => (
                    <li key={bank.id} style={{ cursor: "pointer" }} onClick={() => setBankId(bank.id)}>
                      <strong>{bank.title}</strong>
                      <div><small>{bank.description ?? "No description"}</small></div>
                      <div><small>{bank.questions?.length ?? 0} questions</small></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="admin-card admin-card-summary">
            <div className="admin-card-header">
              <h3>Draw from bank</h3>
            </div>
            <form onSubmit={handleDraw} style={{ padding: 12 }}>
              <input value={bankId} onChange={(e) => setBankId(e.target.value)} placeholder="Bank id" style={{ width: "100%", marginBottom: 8 }} />
              <button className="primary-button" type="submit">Draw questions</button>
            </form>
            <ul className="admin-list">
              {drawn.map((q) => (
                <li key={q.id}><strong>{q.text}</strong><div><small>Type: {q.type}</small></div></li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="insight-column">
          <div className="admin-card admin-card-summary">
            <div className="admin-card-header">
              <h3>Notes</h3>
              <small>Use bank id to draw/questions</small>
            </div>
            <div style={{ padding: 12 }}>
              <p>Create banks and add existing questions via the assessments editor, then draw random selections for tests.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
