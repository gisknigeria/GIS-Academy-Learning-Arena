import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import classesApi, { Announcement } from "../lib/classes-api";
import { SectionHeading } from "../components/SectionHeading";

export default function ClassPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();

  const [schedule, setSchedule] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [enrollResult, setEnrollResult] = useState<string | null>(null);
  const [bulkInput, setBulkInput] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    void classesApi.getSchedule(token, id).then((r) => setSchedule(r)).catch(() => {});
    void classesApi.getAttendanceAnalytics(token, id).then((r) => setAnalytics(r)).catch(() => {});
    void classesApi.listAnnouncements(token, id).then((r) => setAnnouncements(r)).catch(() => {});
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
