import {
  BookOpen,
  CheckCircle2,
  Clock,
  Globe,
  Layers3,
  Loader2,
  Lock,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { coursesApi } from "../lib/courses-api";
import { isAdminRole, isInstructorRole } from "../lib/roles";
import { DELIVERY_MODE_LABELS } from "../types/course";
import type { Course } from "../types/course";

function parseLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function CourseLandingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [course,   setCourse]   = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error,    setError]    = useState("");

  const canManage = Boolean(user && (isAdminRole(user.role) || isInstructorRole(user.role)));

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const [courseData, enrollmentData] = await Promise.all([
        coursesApi.get(token, id),
        coursesApi.isEnrolled(token, id).catch(() => ({ enrolled: false })),
      ]);
      setCourse(courseData);
      setEnrolled(enrollmentData.enrolled);
    } catch {
      setError("Could not load this course. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => { void load(); }, [load]);

  async function handleEnrol() {
    if (!token || !id) return;
    setEnrolling(true);
    setError("");
    try {
      await coursesApi.enroll(token, id);
      setEnrolled(true);
      navigate(paymentBlocked ? "/profile" : `/courses/${id}/workspace`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not enrol. Please try again.");
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="course-landing-loading">
        <Loader2 className="spin" size={28} />
        <span>Loading course…</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-landing-error">
        <p>{error || "Course not found."}</p>
        <button className="secondary-button" onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  const outcomes     = parseLines(course.whatYoullLearn);
  const prereqs      = parseLines(course.prerequisites);
  const audience     = parseLines(course.targetAudience);
  const lessonCount  = course._count?.lessons ?? 0;
  const enrollCount  = course._count?.enrollments ?? 0;

  const paymentBlocked = course.accessStatus?.allowed === false && course.accessStatus.reason === "payment_required";

  return (
    <div className="course-landing">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div
        className="course-landing__hero"
        style={course.bannerUrl ? { backgroundImage: `url(${course.bannerUrl})` } : undefined}
      >
        <div className="course-landing__hero-overlay" />
        <div className="course-landing__hero-body">
          <div className="course-landing__meta-row">
            {course.trainingCategory ? <span className="landing-tag">{course.trainingCategory}</span> : null}
            <span className="landing-tag landing-tag--mode">{DELIVERY_MODE_LABELS[course.deliveryMode]}</span>
            <span className="landing-tag">{course.code}</span>
          </div>
          <h1 className="course-landing__title">{course.title}</h1>
          {course.description ? <p className="course-landing__description">{course.description}</p> : null}

          <div className="course-landing__stats">
            {lessonCount > 0 ? (
              <span><BookOpen size={15} /> {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}</span>
            ) : null}
            {course.estimatedHours ? (
              <span><Clock size={15} /> {course.estimatedHours}h estimated</span>
            ) : null}
            {enrollCount > 0 ? (
              <span><Users size={15} /> {enrollCount.toLocaleString()} enrolled</span>
            ) : null}
            {course.language ? (
              <span><Globe size={15} /> {course.language}</span>
            ) : null}
          </div>
        </div>

        {/* ── Enrol card ───────────────────────────────────────────── */}
        <div className="course-landing__enrol-card">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="course-landing__thumbnail" />
          ) : null}

          {canManage ? (
            <>
              <p className="course-landing__enrol-label">Course management</p>
              <button className="primary-button course-landing__enrol-btn" onClick={() => navigate(`/courses/${course.id}/workspace`)}>
                Manage course content
              </button>
            </>
          ) : enrolled && paymentBlocked ? (
            <div className="course-landing__payment-notice">
              <Lock size={18} />
              <strong>Payment required</strong>
              <p>Complete your payment to unlock this course.</p>
              <button className="primary-button" onClick={() => navigate("/profile")}>Pay now</button>
            </div>
          ) : enrolled ? (
            <>
              <p className="course-landing__enrol-label">You are enrolled</p>
              <button className="primary-button course-landing__enrol-btn" onClick={() => navigate(`/courses/${course.id}/workspace`)}>
                Continue learning
              </button>
            </>
          ) : (
            <>
              <p className="course-landing__enrol-label">Ready to start learning?</p>
              {error ? <p className="form-error">{error}</p> : null}
              <button
                className="primary-button course-landing__enrol-btn"
                onClick={handleEnrol}
                disabled={enrolling}
              >
                {enrolling ? <Loader2 className="spin" size={16} /> : null}
                {enrolling ? "Enrolling…" : "Enrol now"}
              </button>
              {course.requiresPayment ? <p className="course-landing__enrol-hint">Requires active subscription or payment.</p> : null}
            </>
          )}
          {error && course ? <p className="form-error">{error}</p> : null}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="course-landing__body">

        {/* What you'll learn */}
        {outcomes.length > 0 && (
          <section className="course-landing__section">
            <h2>What you'll learn</h2>
            <ul className="course-landing__outcomes">
              {outcomes.map((item, i) => (
                <li key={i}><CheckCircle2 size={16} className="outcome-check" /><span>{item}</span></li>
              ))}
            </ul>
          </section>
        )}

        {/* Prerequisites */}
        {prereqs.length > 0 && (
          <section className="course-landing__section">
            <h2>Prerequisites</h2>
            <ul className="course-landing__list">
              {prereqs.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>
        )}

        {/* Who this is for */}
        {audience.length > 0 && (
          <section className="course-landing__section">
            <h2><Users size={18} /> Who this is for</h2>
            <ul className="course-landing__list">
              {audience.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>
        )}

        {/* Course details */}
        <section className="course-landing__section">
          <h2><Layers3 size={18} /> Course details</h2>
          <dl className="course-landing__details">
            <div><dt>Code</dt><dd>{course.code}</dd></div>
            <div><dt>Delivery</dt><dd>{DELIVERY_MODE_LABELS[course.deliveryMode]}</dd></div>
            {course.trainingCategory ? <div><dt>Category</dt><dd>{course.trainingCategory}</dd></div> : null}
            {course.language         ? <div><dt>Language</dt><dd>{course.language}</dd></div> : null}
            {course.estimatedHours   ? <div><dt>Duration</dt><dd>{course.estimatedHours} hours</dd></div> : null}
            {lessonCount > 0         ? <div><dt>Lessons</dt><dd>{lessonCount}</dd></div> : null}
          </dl>
        </section>

      </div>
    </div>
  );
}
