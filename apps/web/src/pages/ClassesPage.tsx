import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Lock,
  Loader2,
  PlusCircle,
  Unlock,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { classesApi } from "../lib/classes-api";
import { coursesApi } from "../lib/courses-api";
import { usersApi, type AdminUser } from "../lib/users-api";
import type { AttendanceRecord, AttendanceStatus, Cohort, ClassStudent, CreateClassPayload } from "../types/class";
import { ATTENDANCE_STATUS_LABELS, CLASS_WRITE_ROLES } from "../types/class";
import type { Course, DeliveryMode, Lesson } from "../types/course";
import { DELIVERY_MODE_LABELS } from "../types/course";

const ATTENDANCE_STATUSES: AttendanceStatus[] = ["PRESENT", "LATE", "ABSENT", "EXCUSED"];

type ClassFormState = {
  id?: string;
  courseId: string;
  name: string;
  mode: DeliveryMode;
  startsAt: string;
  endsAt: string;
};

const today = new Date().toISOString().slice(0, 10);

const emptyForm: ClassFormState = {
  courseId: "",
  name: "",
  mode: "ONSITE",
  startsAt: "",
  endsAt: "",
};

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toPayload(form: ClassFormState): CreateClassPayload {
  return {
    courseId: form.courseId,
    name: form.name,
    mode: form.mode,
    startsAt: form.startsAt || undefined,
    endsAt: form.endsAt || undefined,
  };
}

export function ClassesPage() {
  const { token, user } = useAuth();
  const [classes, setClasses] = useState<Cohort[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [classLessons, setClassLessons] = useState<Lesson[]>([]);
  const [unlockedLessonIds, setUnlockedLessonIds] = useState<Set<string>>(new Set());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, AttendanceStatus>>({});
  const [enrollUserId, setEnrollUserId] = useState("");
  const [form, setForm] = useState<ClassFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canWrite = Boolean(user && CLASS_WRITE_ROLES.includes(user.role));
  const selectedClass = useMemo(
    () => classes.find((cohort) => cohort.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const loadClasses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const [classData, courseData] = await Promise.all([
        classesApi.list(token),
        coursesApi.list(token, { limit: 100 }),
      ]);
      setClasses(classData);
      setCourses(courseData.data);
      setSelectedClassId((current) => current || classData[0]?.id || "");
      setForm((current) => ({
        ...current,
        courseId: current.courseId || courseData.data[0]?.id || "",
      }));
    } catch {
      setError("Could not load classes.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    async function loadUsers() {
      if (!token || !canWrite) return;
      try {
        const result = await usersApi.list(token, { limit: 100 });
        setUsers(result.data);
        setEnrollUserId((current) => current || result.data[0]?.id || "");
      } catch {
        setUsers([]);
      }
    }

    void loadUsers();
  }, [canWrite, token]);

  const loadClassDetails = useCallback(async () => {
    if (!token || !selectedClassId) {
      setStudents([]);
      setAttendance([]);
      setClassLessons([]);
      setUnlockedLessonIds(new Set());
      return;
    }

    setDetailLoading(true);
    try {
      const [studentData, attendanceData, lessonData, unlockData] = await Promise.all([
        classesApi.students(token, selectedClassId),
        classesApi.attendance(token, selectedClassId, attendanceDate),
        selectedClass ? coursesApi.listLessons(token, selectedClass.courseId) : Promise.resolve([]),
        classesApi.lessonUnlocks(token, selectedClassId),
      ]);
      setStudents(studentData);
      setAttendance(attendanceData);
      setClassLessons(lessonData);
      setUnlockedLessonIds(new Set(unlockData.map((item) => item.lessonId)));
      const currentByUser = new Map(attendanceData.map((record) => [record.userId, record.status]));
      setAttendanceDraft(
        Object.fromEntries(
          studentData.map((student) => [
            student.userId,
            currentByUser.get(student.userId) ?? "PRESENT",
          ]),
        ),
      );
    } catch {
      setError("Could not load class details.");
    } finally {
      setDetailLoading(false);
    }
  }, [attendanceDate, selectedClass, selectedClassId, token]);

  useEffect(() => {
    void loadClassDetails();
  }, [loadClassDetails]);

  function startCreate() {
    setForm({ ...emptyForm, courseId: courses[0]?.id || "" });
    setShowForm(true);
  }

  function startEdit(cohort: Cohort) {
    setForm({
      id: cohort.id,
      courseId: cohort.courseId,
      name: cohort.name,
      mode: cohort.mode,
      startsAt: cohort.startsAt?.slice(0, 10) ?? "",
      endsAt: cohort.endsAt?.slice(0, 10) ?? "",
    });
    setShowForm(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");

    try {
      const saved = form.id
        ? await classesApi.update(token, form.id, toPayload(form))
        : await classesApi.create(token, toPayload(form));
      setClasses((prev) =>
        form.id ? prev.map((cohort) => (cohort.id === saved.id ? saved : cohort)) : [saved, ...prev],
      );
      setSelectedClassId(saved.id);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save class.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(classId: string) {
    if (!token) return;
    setError("");
    try {
      await classesApi.remove(token, classId);
      setClasses((prev) => prev.filter((cohort) => cohort.id !== classId));
      setSelectedClassId((current) => (current === classId ? "" : current));
    } catch {
      setError("Could not delete class.");
    }
  }

  async function handleEnroll() {
    if (!token || !selectedClassId || !enrollUserId) return;
    setSaving(true);
    setError("");

    try {
      await classesApi.enroll(token, selectedClassId, enrollUserId);
      await loadClassDetails();
      await loadClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enroll student.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAttendance() {
    if (!token || !selectedClassId) return;
    setSaving(true);
    setError("");

    try {
      const records = students.map((student) => ({
        userId: student.userId,
        status: attendanceDraft[student.userId] ?? "PRESENT",
      }));
      const updated = await classesApi.markAttendance(token, selectedClassId, {
        date: attendanceDate,
        records,
      });
      setAttendance(updated);
      await loadClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark attendance.");
    } finally {
      setSaving(false);
    }
  }

  function toggleLessonUnlock(lessonId: string) {
    setUnlockedLessonIds((current) => {
      const next = new Set(current);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  }

  async function handleSaveLessonUnlocks() {
    if (!token || !selectedClassId) return;
    setSaving(true);
    setError("");

    try {
      const updated = await classesApi.setLessonUnlocks(token, selectedClassId, Array.from(unlockedLessonIds));
      setUnlockedLessonIds(new Set(updated.map((item) => item.lessonId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save lesson unlocks.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="module-page classes-page">
      <SectionHeading
        eyebrow="Onsite and hybrid"
        title="Classes, cohorts, and attendance"
        action={
          canWrite ? (
            <button className="primary-button small-button" onClick={startCreate}>
              <PlusCircle size={15} />
              Add class
            </button>
          ) : undefined
        }
      />

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? (
        <div className="page-loading">
          <Loader2 size={22} className="spin" />
          Loading classes...
        </div>
      ) : (
        <>
          <div className="module-grid classes-summary-grid">
            <article className="module-card featured">
              <Users size={28} />
              <h3>{classes.length} active cohort{classes.length !== 1 ? "s" : ""}</h3>
              <p>Manage onsite, virtual, and hybrid groups with attendance tracking.</p>
            </article>
            <article className="module-card">
              <CalendarDays size={24} />
              <h3>Next class</h3>
              <p>{classes[0] ? `${classes[0].name} starts ${formatDate(classes[0].startsAt)}` : "No class scheduled yet."}</p>
            </article>
            <article className="module-card">
              <ClipboardCheck size={24} />
              <h3>Attendance</h3>
              <p>Mark present, late, absent, or excused for every enrolled learner.</p>
            </article>
          </div>

          <div className="classes-layout">
            <section className="classes-list-panel">
              <div className="classes-panel-header">
                <div>
                  <span>Cohorts</span>
                  <h3>Class list</h3>
                </div>
              </div>
              <div className="class-card-list">
                {classes.length === 0 ? (
                  <div className="empty-state">
                    <Users size={38} />
                    <strong>No classes yet</strong>
                    <p>Create your first cohort for onsite, virtual, or hybrid learning.</p>
                  </div>
                ) : (
                  classes.map((cohort) => (
                    <article
                      key={cohort.id}
                      className={`class-card ${selectedClassId === cohort.id ? "active" : ""}`}
                    >
                      <button className="class-card-main" onClick={() => setSelectedClassId(cohort.id)}>
                        <strong>{cohort.name}</strong>
                        <span>{cohort.course.code} - {cohort.course.title}</span>
                        <small>
                          {DELIVERY_MODE_LABELS[cohort.mode]} | {cohort._count.students} learner
                          {cohort._count.students !== 1 ? "s" : ""}
                        </small>
                      </button>
                      {canWrite ? (
                        <div className="class-card-actions">
                          <button className="icon-button" aria-label="Edit class" onClick={() => startEdit(cohort)}>
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="icon-button danger"
                            aria-label="Delete class"
                            onClick={() => void handleDelete(cohort.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="classes-detail-panel">
              {selectedClass ? (
                <>
                  <div className="classes-panel-header">
                    <div>
                      <span>{selectedClass.course.code}</span>
                      <h3>{selectedClass.name}</h3>
                    </div>
                    <div className="class-detail-header-actions">
                      <b>{DELIVERY_MODE_LABELS[selectedClass.mode]}</b>
                      {canWrite ? (
                        <Link className="primary-button small-button" to={`/classes/${selectedClass.id}`}>
                          <CalendarPlus size={15} /> Schedule session
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="class-detail-stats">
                    <span><Users size={15} /> {students.length} learners</span>
                    <span><CalendarDays size={15} /> {formatDate(selectedClass.startsAt)}</span>
                    <span><CheckCircle2 size={15} /> {attendance.length} marked today</span>
                  </div>

                  {canWrite && selectedClass.mode === "ONSITE" ? (
                    <section className="lesson-unlock-panel">
                      <div className="classes-panel-header">
                        <div>
                          <span>Onsite access</span>
                          <h3>Unlock lessons for this cohort</h3>
                        </div>
                        <button
                          className="primary-button small-button"
                          disabled={saving || classLessons.length === 0}
                          onClick={() => void handleSaveLessonUnlocks()}
                        >
                          <Unlock size={15} />
                          Save unlocks
                        </button>
                      </div>
                      <p>
                        Onsite learners only access the lessons you unlock here. E-learning and hybrid learners keep self-paced access.
                      </p>
                      {classLessons.length === 0 ? (
                        <div className="empty-state compact">
                          <strong>No lessons found</strong>
                          <p>Add course lessons before setting onsite unlocks.</p>
                        </div>
                      ) : (
                        <div className="lesson-unlock-list">
                          {classLessons.map((lesson) => {
                            const unlocked = unlockedLessonIds.has(lesson.id);
                            return (
                              <button
                                type="button"
                                className={unlocked ? "lesson-unlock-row unlocked" : "lesson-unlock-row"}
                                key={lesson.id}
                                onClick={() => toggleLessonUnlock(lesson.id)}
                              >
                                {unlocked ? <Unlock size={16} /> : <Lock size={16} />}
                                <span>{lesson.order}</span>
                                <strong>{lesson.title}</strong>
                                <b>{unlocked ? "Unlocked" : "Locked"}</b>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  ) : null}

                  {canWrite ? (
                    <div className="class-enroll-row">
                      <select value={enrollUserId} onChange={(event) => setEnrollUserId(event.target.value)}>
                        {users.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.fullName} - {candidate.email}
                          </option>
                        ))}
                      </select>
                      <button
                        className="primary-button small-button"
                        disabled={saving || !enrollUserId}
                        onClick={() => void handleEnroll()}
                      >
                        <UserPlus size={15} />
                        Enroll
                      </button>
                    </div>
                  ) : null}

                  <div className="attendance-toolbar">
                    <label>
                      Attendance date
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(event) => setAttendanceDate(event.target.value)}
                      />
                    </label>
                    {canWrite ? (
                      <button
                        className="primary-button small-button"
                        disabled={saving || students.length === 0}
                        onClick={() => void handleMarkAttendance()}
                      >
                        <ClipboardCheck size={15} />
                        Save attendance
                      </button>
                    ) : null}
                  </div>

                  {detailLoading ? (
                    <div className="inline-loader">
                      <Loader2 size={18} className="spin" />
                      Loading class details...
                    </div>
                  ) : students.length === 0 ? (
                    <div className="empty-state">
                      <Users size={38} />
                      <strong>No learners enrolled</strong>
                      <p>Enroll learners to start attendance tracking.</p>
                    </div>
                  ) : (
                    <div className="attendance-list">
                      {students.map((student) => {
                        const saved = attendance.find((record) => record.userId === student.userId);
                        return (
                          <article className="attendance-row" key={student.id}>
                            <div>
                              <strong>{student.user.fullName}</strong>
                              <span>{student.user.email}</span>
                            </div>
                            {canWrite ? (
                              <select
                                value={attendanceDraft[student.userId] ?? "PRESENT"}
                                onChange={(event) =>
                                  setAttendanceDraft((prev) => ({
                                    ...prev,
                                    [student.userId]: event.target.value as AttendanceStatus,
                                  }))
                                }
                              >
                                {ATTENDANCE_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {ATTENDANCE_STATUS_LABELS[status]}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <b>{saved ? ATTENDANCE_STATUS_LABELS[saved.status] : "Not marked"}</b>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Users size={38} />
                  <strong>Select a class</strong>
                  <p>Choose a cohort to manage students and attendance.</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {showForm ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>{form.id ? "Edit class" : "Add class"}</h2>
              <button className="payment-banner-close" aria-label="Close" onClick={() => setShowForm(false)}>
                X
              </button>
            </div>
            <form className="modal-form" onSubmit={(event) => void handleSave(event)}>
              <label>
                Course
                <select
                  value={form.courseId}
                  onChange={(event) => setForm({ ...form, courseId: event.target.value })}
                  required
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Class name
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Ibadan Weekend Cohort"
                  required
                />
              </label>
              <label>
                Mode
                <select
                  value={form.mode}
                  onChange={(event) => setForm({ ...form, mode: event.target.value as DeliveryMode })}
                >
                  {Object.entries(DELIVERY_MODE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-row">
                <label>
                  Starts
                  <input
                    type="date"
                    value={form.startsAt}
                    onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                  />
                </label>
                <label>
                  Ends
                  <input
                    type="date"
                    value={form.endsAt}
                    onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button className="primary-button" disabled={saving || !form.courseId || !form.name.trim()}>
                  {saving ? "Saving..." : "Save class"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
