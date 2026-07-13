import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import classesApi, { Announcement } from "../lib/classes-api";
import { SectionHeading } from "../components/SectionHeading";
import { CLASS_WRITE_ROLES, type ClassMessage, type LiveSession } from "../types/class";

export default function ClassPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();

  const [schedule, setSchedule] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [messages, setMessages] = useState<ClassMessage[]>([]);
  const [enrollResult, setEnrollResult] = useState<string | null>(null);
  const [bulkInput, setBulkInput] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageError, setMessageError] = useState("");
  const [liveForm, setLiveForm] = useState({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    meetingUrl: "",
    presentationUrl: "",
    bookUrl: "",
  });
  const [liveError, setLiveError] = useState("");

  const canWrite = Boolean(user && CLASS_WRITE_ROLES.includes(user.role));

  useEffect(() => {
    if (!token || !id) return;
    void classesApi.getSchedule(token, id).then((r) => setSchedule(r)).catch(() => {});
    void classesApi.getAttendanceAnalytics(token, id).then((r) => setAnalytics(r)).catch(() => {});
    void classesApi.listAnnouncements(token, id).then((r) => setAnnouncements(r)).catch(() => {});
    void classesApi.listLiveSessions(token, id).then((r) => setLiveSessions(r)).catch(() => {});
    void classesApi.messages(token, id).then((r) => setMessages(r)).catch(() => {});
  }, [token, id]);

  async function handleBulkEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    const userIds = bulkInput.split(/[,\s]+/).filter(Boolean);
    try {
      const res = await classesApi.bulkEnroll(token, id, userIds);
      setEnrollResult(`Enrolled ${res.enrolled} students`);
    } catch (err) {
      setEnrollResult("Enrollment failed");
    }
  }

  async function handleExport() {
    if (!token || !id) return;
    try {
      const csv = await classesApi.exportAttendanceCsv(token, id);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // ignore
    }
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const body = (form.elements.namedItem("body") as HTMLTextAreaElement).value;
    try {
      const created = await classesApi.createAnnouncement(token, id, { title, body }, user?.id);
      setAnnouncements((s) => [created, ...s]);
      form.reset();
    } catch (err) {
      // ignore
    }
  }

  async function handleScheduleLiveSession(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setLiveError("");

    try {
      const created = await classesApi.createLiveSession(token, id, {
        title: liveForm.title,
        description: liveForm.description || undefined,
        startsAt: new Date(liveForm.startsAt).toISOString(),
        endsAt: liveForm.endsAt ? new Date(liveForm.endsAt).toISOString() : undefined,
        meetingUrl: liveForm.meetingUrl || undefined,
        presentationUrl: liveForm.presentationUrl || undefined,
        bookUrl: liveForm.bookUrl || undefined,
      });
      setLiveSessions((current) => [...current, created].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
      setLiveForm({ title: "", description: "", startsAt: "", endsAt: "", meetingUrl: "", presentationUrl: "", bookUrl: "" });
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Could not schedule live class.");
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id || !messageBody.trim()) return;
    setMessageError("");

    try {
      const created = await classesApi.createMessage(token, id, messageBody.trim());
      setMessages((current) => [...current, created]);
      setMessageBody("");
    } catch (err) {
      setMessageError(err instanceof Error ? err.message : "Could not send message.");
    }
  }

  return (
    <div>
      <SectionHeading eyebrow="Class" title={schedule?.name ?? "Class details"} />

      <section className="content-grid">
        <div className="workstream">
          <div className="admin-card admin-card-summary">
            <div className="admin-card-header">
              <h3>Schedule</h3>
              <small>Course and timing</small>
            </div>
            {schedule ? (
              <div style={{ padding: 16 }}>
                <strong>{schedule.course.title}</strong>
                <div>{schedule.trainer?.fullName ?? "No trainer"}</div>
                <div>{schedule.startsAt ? new Date(schedule.startsAt).toLocaleString() : "TBD"} — {schedule.endsAt ? new Date(schedule.endsAt).toLocaleString() : "TBD"}</div>
              </div>
            ) : (
              <p>Loading schedule…</p>
            )}
          </div>

          <div className="admin-card admin-card-summary">
            <div className="admin-card-header">
              <h3>Attendance analytics</h3>
              <small>Summary counts</small>
            </div>
            {analytics ? (
              <ul className="admin-status-list">
                <li><strong>{analytics.totalRecords}</strong><span>Total records</span></li>
                {analytics.breakdown.map((b: any) => (
                  <li key={b.status}><strong>{b.count}</strong><span>{b.status.toLowerCase()}</span></li>
                ))}
              </ul>
            ) : (
              <p>Loading analytics…</p>
            )}
          </div>

          <div className="admin-card admin-card-list">
            <div className="admin-card-header">
              <h3>Live classes</h3>
              <small>Schedule external meeting links and supporting workspace</small>
            </div>
            {canWrite ? (
              <form className="live-session-form" onSubmit={handleScheduleLiveSession}>
                <input
                  value={liveForm.title}
                  onChange={(event) => setLiveForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Session title"
                  required
                />
                <textarea
                  value={liveForm.description}
                  onChange={(event) => setLiveForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="What will this live class cover?"
                />
                <div className="form-row">
                  <label>
                    Starts
                    <input
                      type="datetime-local"
                      value={liveForm.startsAt}
                      onChange={(event) => setLiveForm((current) => ({ ...current, startsAt: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Ends
                    <input
                      type="datetime-local"
                      value={liveForm.endsAt}
                      onChange={(event) => setLiveForm((current) => ({ ...current, endsAt: event.target.value }))}
                    />
                  </label>
                </div>
                <input
                  value={liveForm.presentationUrl}
                  onChange={(event) => setLiveForm((current) => ({ ...current, presentationUrl: event.target.value }))}
                  placeholder="Presentation link"
                />
                <input
                  value={liveForm.bookUrl}
                  onChange={(event) => setLiveForm((current) => ({ ...current, bookUrl: event.target.value }))}
                  placeholder="Book / handout link"
                />
                <input
                  value={liveForm.meetingUrl}
                  onChange={(event) => setLiveForm((current) => ({ ...current, meetingUrl: event.target.value }))}
                  placeholder="Google Meet / Zoom / Teams link"
                  required
                />
                {liveError ? <p className="form-error">{liveError}</p> : null}
                <button className="primary-button" type="submit">Schedule live class</button>
              </form>
            ) : null}
            <div className="live-session-list">
              {liveSessions.length === 0 ? (
                <p className="muted-panel">No live class scheduled yet.</p>
              ) : (
                liveSessions.map((session) => (
                  <article className="live-session-card" key={session.id}>
                    <div>
                      <strong>{session.title}</strong>
                      <span>{new Date(session.startsAt).toLocaleString()}</span>
                      {session.description ? <p>{session.description}</p> : null}
                    </div>
                    <div className="live-session-actions">
                      {session.meetingUrl ? (
                        <a className="primary-button small-button" href={session.meetingUrl} target="_blank" rel="noreferrer">
                          Join meeting
                        </a>
                      ) : null}
                      <Link className="secondary-button small-button" to={`/live-sessions/${session.id}`}>
                        Open workspace
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="admin-card admin-card-list">
            <div className="admin-card-header">
              <h3>Announcements</h3>
              <small>Class notices</small>
            </div>
            <form onSubmit={handleCreateAnnouncement} style={{ padding: 12 }}>
              <input name="title" placeholder="Title" required style={{ width: "100%", marginBottom: 8 }} />
              <textarea name="body" placeholder="Message" required style={{ width: "100%", marginBottom: 8 }} />
              <button className="primary-button" type="submit">Post announcement</button>
            </form>
            <ul className="admin-list">
              {announcements.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.title}</strong>
                    <small>{a.author?.fullName ?? ""}</small>
                  </div>
                  <div>
                    <small>{new Date(a.createdAt).toLocaleString()}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-card admin-card-list">
            <div className="admin-card-header">
              <h3>Class messages</h3>
              <small>Hybrid learner and trainer conversation</small>
            </div>
            <div className="class-message-list">
              {messages.length === 0 ? (
                <p className="muted-panel">No messages yet. Start the class conversation here.</p>
              ) : (
                messages.map((message) => (
                  <article className={message.senderId === user?.id ? "class-message own" : "class-message"} key={message.id}>
                    <div>
                      <strong>{message.sender.fullName}</strong>
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{message.body}</p>
                  </article>
                ))
              )}
            </div>
            <form className="class-message-form" onSubmit={handleSendMessage}>
              <textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Ask a question, reply to learners, or share a class update..."
                rows={3}
              />
              {messageError ? <p className="form-error">{messageError}</p> : null}
              <button className="primary-button" disabled={!messageBody.trim()}>
                Send message
              </button>
            </form>
          </div>

          <div className="admin-card admin-card-list">
            <div className="admin-card-header">
              <h3>Bulk enroll</h3>
              <small>Paste user IDs (comma or whitespace separated)</small>
            </div>
            <form onSubmit={handleBulkEnroll} style={{ padding: 12 }}>
              <textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} placeholder="user1,user2,user3" style={{ width: "100%", marginBottom: 8 }} />
              <button className="primary-button" type="submit">Enroll users</button>
            </form>
            {enrollResult && <p style={{ padding: 12 }}>{enrollResult}</p>}
          </div>
        </div>

        <aside className="insight-column">
          <div className="admin-card admin-card-summary">
            <div className="admin-card-header">
              <h3>Export attendance</h3>
              <small>Download CSV</small>
            </div>
            <div style={{ padding: 12 }}>
              <button className="primary-button" onClick={handleExport}>Download CSV</button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
