import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { assessmentsApi } from "../lib/assessments-api";
import type { AttemptSession } from "../types/assessment";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function AssessmentTakePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [session, setSession] = useState<AttemptSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmitted = useRef(false);

  // ── Start / resume attempt ───────────────────────────────────────────────
  const start = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError("");
    try {
      const data = await assessmentsApi.startAttempt(token, id);
      setSession(data);
      setAnswers(data.savedAnswers ?? {});

      // Compute elapsed time and set countdown
      const elapsed = Math.floor(
        (Date.now() - new Date(data.startedAt).getTime()) / 1000,
      );
      const totalSeconds = data.durationMin * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start assessment.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { void start(); }, [start]);

  // ── Countdown ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || submitting) return;

    if (timeLeft <= 0 && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      void handleSubmit(true);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft === 0]);

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(timedOut = false) {
    if (!token || !session) return;
    clearInterval(timerRef.current!);
    setSubmitting(true);
    setError("");
    try {
      const result = await assessmentsApi.submitAttempt(token, session.attemptId, answers);
      void timedOut; // acknowledged — same endpoint handles both
      navigate(`/assessments/attempts/${result.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 size={22} className="spin" />Starting assessment…
      </div>
    );
  }

  if (error && !session) {
    return (
      <section className="module-page">
        <Link className="back-link" to="/assessments"><ArrowLeft size={16} />Back</Link>
        <p className="form-error">{error}</p>
      </section>
    );
  }

  if (!session) return null;

  const questions = session.questions;
  const currentQ = questions[currentIndex];
  const totalAnswered = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
  const isLast = currentIndex === questions.length - 1;
  const isLow = timeLeft !== null && timeLeft <= 60;

  return (
    <section className="quiz-page">
      {/* ── Top bar ── */}
      <header className="quiz-topbar">
        <div className="quiz-title-area">
          <span className="quiz-eyebrow">Assessment</span>
          <h1>{session.title}</h1>
        </div>
        <div className="quiz-topbar-right">
          <div className={`quiz-timer ${isLow ? "quiz-timer--low" : ""}`}>
            <Clock size={16} />
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>
          <span className="quiz-progress-label">
            {totalAnswered} / {questions.length} answered
          </span>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="quiz-layout">
        {/* Question navigator */}
        <aside className="quiz-nav">
          <p className="quiz-nav-label">Questions</p>
          <div className="quiz-nav-grid">
            {questions.map((q, i) => (
              <button
                key={q.id}
                className={[
                  "quiz-nav-btn",
                  i === currentIndex ? "active" : "",
                  answers[q.id] ? "answered" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {error ? (
            <p className="form-error" style={{ fontSize: "0.82rem", marginTop: 8 }}>{error}</p>
          ) : null}
          <button
            className="primary-button quiz-submit-btn"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
            {submitting ? "Submitting…" : "Submit quiz"}
          </button>
        </aside>

        {/* Current question */}
        <article className="quiz-question-panel">
          <div className="quiz-q-meta">
            <span className="quiz-q-counter">Question {currentIndex + 1} of {questions.length}</span>
            <span className="quiz-q-points">{currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}</span>
          </div>

          <p className="quiz-q-text">{currentQ.text}</p>

          {/* MCQ */}
          {currentQ.type === "MCQ" && (
            <div className="quiz-options">
              {currentQ.options.map((opt, i) => (
                <label key={i} className={`quiz-option ${answers[currentQ.id] === opt ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name={currentQ.id}
                    value={opt}
                    checked={answers[currentQ.id] === opt}
                    onChange={() => setAnswer(currentQ.id, opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {/* True / False */}
          {currentQ.type === "TRUE_FALSE" && (
            <div className="quiz-options">
              {["true", "false"].map((val) => (
                <label key={val} className={`quiz-option ${answers[currentQ.id] === val ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name={currentQ.id}
                    value={val}
                    checked={answers[currentQ.id] === val}
                    onChange={() => setAnswer(currentQ.id, val)}
                  />
                  <span>{val === "true" ? "True" : "False"}</span>
                </label>
              ))}
            </div>
          )}

          {/* Short answer */}
          {currentQ.type === "SHORT_ANSWER" && (
            <textarea
              className="quiz-short-answer"
              rows={4}
              placeholder="Type your answer here…"
              value={answers[currentQ.id] ?? ""}
              onChange={(e) => setAnswer(currentQ.id, e.target.value)}
            />
          )}

          {/* Unanswered warning */}
          {!answers[currentQ.id] && (
            <p className="quiz-unanswered">
              <AlertCircle size={14} />Not answered yet
            </p>
          )}

          {/* Prev / Next */}
          <div className="quiz-nav-actions">
            <button
              className="secondary-button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              <ArrowLeft size={15} />Previous
            </button>
            {!isLast ? (
              <button className="primary-button" onClick={() => setCurrentIndex((i) => i + 1)}>
                Next<ArrowRight size={15} />
              </button>
            ) : (
              <button
                className="primary-button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
              >
                {submitting ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                {submitting ? "Submitting…" : "Finish & submit"}
              </button>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
