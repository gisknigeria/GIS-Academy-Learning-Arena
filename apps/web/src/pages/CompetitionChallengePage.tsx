import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { competitionsApi } from "../lib/competitions-api";
import type { CompetitionAttemptResult, CompetitionSession } from "../types/competition";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CompetitionChallengePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<CompetitionSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CompetitionAttemptResult | null>(null);
  const [error, setError] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmitted = useRef(false);

  const start = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError("");
    try {
      const data = await competitionsApi.startAttempt(token, id);
      setSession(data);
      setAnswers(data.savedAnswers ?? {});
      setTimeLeft(data.durationMin * 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start challenge.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { void start(); }, [start]);

  // Countdown
  useEffect(() => {
    if (timeLeft === null || submitting || result) return;

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

  async function handleSubmit(timedOut = false) {
    if (!token || !session || !id) return;
    clearInterval(timerRef.current!);
    setSubmitting(true);
    setError("");
    const durationSec = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await competitionsApi.submitAttempt(
        token, id, session.attemptId, answers, timedOut ? undefined : durationSec,
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  function setAnswer(qId: string, val: string) {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  }

  // ── Result screen ────────────────────────────────────────────────────────
  if (result) {
    const pct = result.percentage ?? 0;
    return (
      <section className="module-page">
        <div className={`result-card ${pct >= 50 ? "result-pass" : "result-fail"}`}>
          <div className="result-badge"><Trophy size={28} />Challenge submitted!</div>
          <h1 className="result-score">{pct}%</h1>
          <p className="result-sub">{result.score} / {result.maxScore} points</p>
          {result.durationSec && (
            <p className="result-title">Time: {formatTime(result.durationSec)}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Link className="secondary-button" to={`/arena/${id}`}>
            <ArrowLeft size={15} />View leaderboard
          </Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return <div className="page-loading"><Loader2 size={22} className="spin" />Starting challenge…</div>;
  }

  if (error && !session) {
    return (
      <section className="module-page">
        <Link className="back-link" to={`/arena/${id}`}><ArrowLeft size={16} />Back</Link>
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
      {/* Top bar */}
      <header className="quiz-topbar">
        <div className="quiz-title-area">
          <span className="quiz-eyebrow">
            <span className="live-dot" style={{ width: 8, height: 8 }} />
            Live competition
          </span>
          <h1>{session.title}</h1>
        </div>
        <div className="quiz-topbar-right">
          <div className={`quiz-timer ${isLow ? "quiz-timer--low" : ""}`}>
            <Clock size={16} />
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>
          <span className="quiz-progress-label">{totalAnswered} / {questions.length} answered</span>
        </div>
      </header>

      <div className="quiz-layout">
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
          {error ? <p className="form-error" style={{ fontSize: "0.82rem" }}>{error}</p> : null}
          <button
            className="primary-button quiz-submit-btn"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </aside>

        <article className="quiz-question-panel">
          <div className="quiz-q-meta">
            <span className="quiz-q-counter">Question {currentIndex + 1} of {questions.length}</span>
            <span className="quiz-q-points">{currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}</span>
          </div>

          <p className="quiz-q-text">{currentQ.text}</p>

          {currentQ.type === "MCQ" && (
            <div className="quiz-options">
              {currentQ.options.map((opt, i) => (
                <label key={i} className={`quiz-option ${answers[currentQ.id] === opt ? "selected" : ""}`}>
                  <input type="radio" name={currentQ.id} value={opt}
                    checked={answers[currentQ.id] === opt}
                    onChange={() => setAnswer(currentQ.id, opt)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {currentQ.type === "TRUE_FALSE" && (
            <div className="quiz-options">
              {["true", "false"].map((val) => (
                <label key={val} className={`quiz-option ${answers[currentQ.id] === val ? "selected" : ""}`}>
                  <input type="radio" name={currentQ.id} value={val}
                    checked={answers[currentQ.id] === val}
                    onChange={() => setAnswer(currentQ.id, val)} />
                  <span>{val === "true" ? "True" : "False"}</span>
                </label>
              ))}
            </div>
          )}

          {currentQ.type === "SHORT_ANSWER" && (
            <textarea
              className="quiz-short-answer"
              rows={4}
              placeholder="Type your answer…"
              value={answers[currentQ.id] ?? ""}
              onChange={(e) => setAnswer(currentQ.id, e.target.value)}
            />
          )}

          {!answers[currentQ.id] && (
            <p className="quiz-unanswered"><AlertCircle size={14} />Not answered yet</p>
          )}

          <div className="quiz-nav-actions">
            <button className="secondary-button" disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}>
              <ArrowLeft size={15} />Previous
            </button>
            {!isLast ? (
              <button className="primary-button" onClick={() => setCurrentIndex((i) => i + 1)}>
                Next<ArrowRight size={15} />
              </button>
            ) : (
              <button className="primary-button" disabled={submitting}
                onClick={() => void handleSubmit()}>
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
