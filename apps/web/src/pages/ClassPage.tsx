import {
  CalendarPlus, Download, ExternalLink, Layers, LayoutDashboard,
  LifeBuoy, MapPin, MessageSquare, Megaphone, MonitorPlay, Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClassStudio } from "../components/ClassStudio";
import { TutorSupportPanel } from "../components/TutorSupportPanel";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import classesApi, { type Announcement, type ScheduleSummary } from "../lib/classes-api";
import { CLASS_WRITE_ROLES, type ClassMessage, type LiveSession } from "../types/class";

type Tab = "overview" | "sessions" | "support" | "studio" | "announcements" | "messages" | "students";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",      label: "Overview",      icon: <LayoutDashboard size={15} /> },
  { id: "sessions",      label: "Sessions",      icon: <CalendarPlus size={15} /> },
  { id: "support",       label: "Tutor support", icon: <LifeBuoy size={15} /> },
  { id: "studio",        label: "Studio",        icon: <Layers size={15} /> },
  { id: "announcements", label: "Announcements", icon: <Megaphone size={15} /> },
  { id: "messages",      label: "Messages",      icon: <MessageSquare size={15} /> },
  { id: "students",      label: "Students",      icon: <Users size={15} /> },
];

export default function ClassPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [schedule, setSchedule]           = useState<ScheduleSummary | null>(null);
  const [analytics, setAnalytics]         = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [liveSessions, setLiveSessions]   = useState<LiveSession[]>([]);
  const [messages, setMessages]           = useState<ClassMessage[]>([]);
  const [enrollResult, setEnrollResult]   = useState<string | null>(null);
  const [bulkInput, setBulkInput]         = useState("");
  const [messageBody, setMessageBody]     = useState("");
  const [messageError, setMessageError]   = useState("");
  const [liveError, setLiveError]         = useState("");
  const [liveForm, setLiveForm] = useState({
    title: "", description: "", startsAt: "", endsAt: "",
    meetingUrl: "", location: "", presentationUrl: "", bookUrl: "",
  });

  const canWrite = Boolean(user && CLASS_WRITE_ROLES.includes(user.role));

  useEffect(() => {
    if (!token || !id) return;
    void classesApi.getSchedule(token, id).then(setSchedule).catch(() => {});
    void classesApi.getAttendanceAnalytics(token, id).then(setAnalytics).catch(() => {});
    void classesApi.listAnnouncements(token, id).then(setAnnouncements).catch(() => {});
    void classesApi.listLiveSessions(token, id).then(setLiveSessions).catch(() => {});
    void classesApi.messages(token, id).then(setMessages).catch(() => {});
  }, [token, id]);

  async function handleBulkEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    const userIds = bulkInput.split(/[,\s]+/).filter(Boolean);
    try {
      const res = await classesApi.bulkEnroll(token, id, userIds);
      setEnrollResult(`Enrolled ${res.enrolled} student(s)`);
    } catch {
      setEnrollResult("Enrollment failed");
    }
  }

  async function handleExport() {
    if (!token || !id) return;
    try {
      const csv = await classesApi.exportAttendanceCsv(token, id);
      const blob = new Blob([csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `attendance-${id}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    const form  = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const body  = (form.elements.namedItem("body") as HTMLTextAreaElement).value;
    try {
      const created = await classesApi.createAnnouncement(token, id, { title, body }, user?.id);
      setAnnouncements((s) => [created, ...s]);
      form.reset();
    } catch { /* ignore */ }
  }

  async function handleScheduleLiveSession(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setLiveError("");
    try {
      const created = await classesApi.createLiveSession(token, id, {
        title:           liveForm.title,
        description:     liveForm.description   || undefined,
        startsAt:        new Date(liveForm.startsAt).toISOString(),
        endsAt:          liveForm.endsAt ? new Date(liveForm.endsAt).toISOString() : undefined,
        meetingUrl:      liveForm.meetingUrl     || undefined,
        location:        liveForm.location       || undefined,
        presentationUrl: liveForm.presentationUrl || undefined,
        bookUrl:         liveForm.bookUrl        || undefined,
      });
      setLiveSessions((cur) =>
        [...cur, created].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
      );
      setLiveForm({ title: "", description: "", startsAt: "", endsAt: "", meetingUrl: "", location: "", presentationUrl: "", bookUrl: "" });
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Could not schedule session.");
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id || !messageBody.trim()) return;
    setMessageError("");
    try {
      const created = await classesApi.createMessage(token, id, messageBody.trim());
      setMessages((cur) => [...cur, created]);
      setMessageBody("");
    } catch (err) {
      setMessageError(err instanceof Error ? err.message : "Could not send message.");
    }
  }

  return (
    <div className="class-page">
      {/* ── Page header ── */}
      <div className="class-page__header">
        <SectionHeading eyebrow="Class" title={schedule?.name ?? "Class details"} compact />
        {schedule && (
          <div className="class-page__meta">
            <span className="class-page__course-chip">
              {schedule.course.code} — {schedule.course.title}
            </span>
            <span className="class-page__mode-chip">{schedule.mode.replace("_", " ")}</span>
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <nav className="class-tabs" role="tablist" aria-label="Class sections">
        {TABS.filter((tab) => tab.id !== "support" || schedule?.mode === "HYBRID").map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={"class-tab" + (activeTab === tab.id ? " is-active" : "")}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.icon}
            {tab.label}
            {tab.id === "studio" && (
              <span className="class-tab__badge">Studio</span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Tab panels ── */}
      <div className="class-tab-panel">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="class-overview-grid">
            <div className="admin-card admin-card-summary">
              <div className="admin-card-header">
                <h3>Schedule</h3>
                <small>Course and timing</small>
              </div>
              {schedule ? (
                <div style={{ padding: 16 }}>
                  <strong>{schedule.course.title}</strong>
                  <div style={{ color: "var(--muted)", marginTop: 6 }}>
                    Trainer: {schedule.trainer?.fullName ?? "Not assigned"}
                  </div>
                  <div style={{ color: "var(--muted)", marginTop: 4 }}>
                    {schedule.startsAt ? new Date(schedule.startsAt).toLocaleString() : "TBD"}
                    {" — "}
                    {schedule.endsAt   ? new Date(schedule.endsAt).toLocaleString()   : "TBD"}
                  </div>
                </div>
              ) : (
                <p style={{ padding: 16, color: "var(--muted)" }}>Loading schedule…</p>
              )}
            </div>

            <div className="admin-card admin-card-summary">
              <div className="admin-card-header">
                <h3>Attendance</h3>
                <small>Summary</small>
              </div>
              {analytics ? (
                <ul className="admin-status-list">
                  <li><strong>{analytics.totalRecords}</strong><span>Total records</span></li>
                  {analytics.breakdown.map((b: { status: string; count: number }) => (
                    <li key={b.status}><strong>{b.count}</strong><span>{b.status.toLowerCase()}</span></li>
                  ))}
                </ul>
              ) : (
                <p style={{ padding: 16, color: "var(--muted)" }}>Loading…</p>
              )}
              <div style={{ padding: "0 16px 16px" }}>
                <button className="secondary-button small-button" onClick={() => void handleExport()}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SESSIONS */}
        {activeTab === "sessions" && (
          <div className="class-sessions-layout">
            {canWrite && (
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Schedule a session</h3>
                  <small>Physical class, online meeting, or hybrid</small>
                </div>
                <form className="live-session-form" onSubmit={(e) => void handleScheduleLiveSession(e)}>
                  <input value={liveForm.title} onChange={(e) => setLiveForm((c) => ({ ...c, title: e.target.value }))} placeholder="Session title" required />
                  <textarea value={liveForm.description} onChange={(e) => setLiveForm((c) => ({ ...c, description: e.target.value }))} placeholder="What will this session cover?" />
                  <div className="form-row">
                    <label>Starts<input type="datetime-local" value={liveForm.startsAt} onChange={(e) => setLiveForm((c) => ({ ...c, startsAt: e.target.value }))} required /></label>
                    <label>Ends<input type="datetime-local" value={liveForm.endsAt} onChange={(e) => setLiveForm((c) => ({ ...c, endsAt: e.target.value }))} /></label>
                  </div>
                  {schedule?.mode === "ONSITE" || schedule?.mode === "HYBRID" ? (
                    <label className="live-session-field">
                      <span><MapPin size={15} /> Venue</span>
                      <input value={liveForm.location} onChange={(e) => setLiveForm((c) => ({ ...c, location: e.target.value }))} placeholder="Training room, school hall, or address" required={schedule?.mode === "ONSITE"} />
                    </label>
                  ) : null}
                  {schedule?.mode !== "ONSITE" ? (
                    <label className="live-session-field">
                      <span><MonitorPlay size={15} /> Meeting link</span>
                      <input value={liveForm.meetingUrl} onChange={(e) => setLiveForm((c) => ({ ...c, meetingUrl: e.target.value }))} placeholder="Google Meet, Zoom, or Teams link" required />
                    </label>
                  ) : null}
                  <input value={liveForm.presentationUrl} onChange={(e) => setLiveForm((c) => ({ ...c, presentationUrl: e.target.value }))} placeholder="Presentation link (optional)" />
                  <input value={liveForm.bookUrl} onChange={(e) => setLiveForm((c) => ({ ...c, bookUrl: e.target.value }))} placeholder="Book / handout link (optional)" />
                  {liveError && <p className="form-error">{liveError}</p>}
                  <button className="primary-button" type="submit"><CalendarPlus size={16} /> Schedule session</button>
                </form>
              </div>
            )}

            <div className="live-session-list">
              {liveSessions.length === 0 ? (
                <p className="muted-panel">No sessions scheduled yet.</p>
              ) : liveSessions.map((session) => (
                <article className="live-session-card" key={session.id}>
                  <div>
                    <strong>{session.title}</strong>
                    <span>{new Date(session.startsAt).toLocaleString()}</span>
                    {session.location && <span className="live-session-location"><MapPin size={14} />{session.location}</span>}
                    {session.description && <p>{session.description}</p>}
                  </div>
                  <div className="live-session-actions">
                    {session.meetingUrl && (
                      <a className="primary-button small-button" href={session.meetingUrl} target="_blank" rel="noreferrer">
                        Join <ExternalLink size={13} />
                      </a>
                    )}
                    <Link className="secondary-button small-button" to={`/live-sessions/${session.id}`}>
                      Workspace
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === "support" && schedule?.mode === "HYBRID" && (
          <TutorSupportPanel classId={id ?? ""} />
        )}

        {/* STUDIO */}
        {activeTab === "studio" && (
          <ClassStudio classId={id ?? ""} schedule={schedule} />
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <div className="class-announcements-layout">
            {canWrite && (
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Post announcement</h3>
                </div>
                <form onSubmit={(e) => void handleCreateAnnouncement(e)} style={{ padding: 14, display: "grid", gap: 10 }}>
                  <input name="title" placeholder="Title" required />
                  <textarea name="body" placeholder="Message" required rows={3} />
                  <button className="primary-button" type="submit"><Megaphone size={15} /> Post</button>
                </form>
              </div>
            )}
            <ul className="admin-list">
              {announcements.length === 0 && <p className="muted-panel">No announcements yet.</p>}
              {announcements.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.title}</strong>
                    <small>{a.author?.fullName ?? ""}</small>
                  </div>
                  <small>{new Date(a.createdAt).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* MESSAGES */}
        {activeTab === "messages" && (
          <div className="class-messages-layout">
            <div className="class-message-list">
              {messages.length === 0 ? (
                <p className="muted-panel">No messages yet. Start the class conversation here.</p>
              ) : messages.map((msg) => (
                <article className={msg.senderId === user?.id ? "class-message own" : "class-message"} key={msg.id}>
                  <div><strong>{msg.sender.fullName}</strong><span>{new Date(msg.createdAt).toLocaleString()}</span></div>
                  <p>{msg.body}</p>
                </article>
              ))}
            </div>
            <form className="class-message-form" onSubmit={(e) => void handleSendMessage(e)}>
              <textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Ask a question, reply to learners, or share an update…" rows={3} />
              {messageError && <p className="form-error">{messageError}</p>}
              <button className="primary-button" disabled={!messageBody.trim()}>Send</button>
            </form>
          </div>
        )}

        {/* STUDENTS */}
        {activeTab === "students" && canWrite && (
          <div className="class-students-layout">
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Bulk enroll</h3>
                <small>Paste user IDs separated by commas or spaces</small>
              </div>
              <form onSubmit={(e) => void handleBulkEnroll(e)} style={{ padding: 14, display: "grid", gap: 10 }}>
                <textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} placeholder="user1, user2, user3" rows={3} />
                <button className="primary-button" type="submit"><Users size={15} /> Enroll</button>
              </form>
              {enrollResult && <p style={{ padding: "0 14px 14px", color: "var(--green-700)" }}>{enrollResult}</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
