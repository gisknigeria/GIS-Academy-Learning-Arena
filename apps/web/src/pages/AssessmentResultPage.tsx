import { ArrowLeft, CheckCircle2, HelpCircle, Loader2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { assessmentsApi } from "../lib/assessments-api";
import type { AttemptResult } from "../types/assessment";
import { QUESTION_TYPE_LABELS } from "../types/assessment";

function formatAnswer(answer: string | string[] | null) {
  if (!answer) return "";
  return Array.isArray(answer) ? answer.join(", ") : answer;
}

export function AssessmentResultPage() {
  const { attemptId } = useParams();
  const { token } = useAuth();
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !attemptId) return;
    setLoading(true);
    setError("");
    try {
      const data = await assessmentsApi.getAttemptResult(token, attemptId);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load result.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, token]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="page-loading"><Loader2 size={22} className="spin" />Loading result…</div>
    );
  }

  if (error || !result) {
    return (
      <section className="module-page">
        <Link className="back-link" to="/assessments"><ArrowLeft size={16} />Assessments</Link>
        <p className="form-error">{error || "Result not found."}</p>
      </section>
    );
  }

  const passed = result.passed;
  const scoreColour = passed ? "result-pass" : "result-fail";

  return (
    <section className="module-page">
      <Link className="back-link" to="/assessments"><ArrowLeft size={16} />Assessments</Link>

      {/* ── Score card ── */}
      <div className={`result-card ${scoreColour}`}>
        <div className="result-badge">
          {passed
            ? <><CheckCircle2 size={28} />Passed</>
            : <><XCircle size={28} />Not passed</>}
        </div>
        <h1 className="result-score">{result.percentage}%</h1>
        <p className="result-sub">
          {result.score} / {result.maxScore} points · Pass mark {result.passMark}%
        </p>
        <p className="result-title">{result.title}</p>
      </div>

      {/* ── Breakdown ── */}
      <h2 className="result-breakdown-heading">Question breakdown</h2>
      <div className="result-breakdown">
        {result.breakdown.map((item, i) => {
          const isCorrect = item.correct === true;
          const isWrong = item.correct === false;
          const isNote = item.type === "NOTE";
          const isManual = item.correct === null && !isNote;

          return (
            <article
              key={item.questionId}
              className={[
                "result-question",
                isCorrect ? "rq-correct" : isWrong ? "rq-wrong" : "rq-manual",
              ].join(" ")}
            >
              <div className="rq-header">
                <div className="rq-number-badge">
                  {isCorrect ? <CheckCircle2 size={14} /> : isWrong ? <XCircle size={14} /> : <HelpCircle size={14} />}
                  {i + 1}
                </div>
                <div className="rq-meta">
                  <span className="question-type-badge">{QUESTION_TYPE_LABELS[item.type]}</span>
                  {!isNote ? <span className="rq-points">{item.earnedPoints} / {item.points} pt{item.points !== 1 ? "s" : ""}</span> : null}
                </div>
              </div>

              <p className="rq-text">{item.text}</p>

              {!isNote ? <div className="rq-answers">
                {item.studentAnswer ? (
                  <div className={`rq-answer rq-student ${isCorrect ? "rq-correct-answer" : isWrong ? "rq-wrong-answer" : ""}`}>
                    <span>Your answer:</span> {formatAnswer(item.studentAnswer)}
                  </div>
                ) : (
                  <div className="rq-answer rq-student rq-unanswered">No answer given</div>
                )}
                {item.correctAnswer && item.correct !== true ? (
                  <div className="rq-answer rq-correct-answer">
                    <CheckCircle2 size={13} /><span>Correct:</span> {formatAnswer(item.correctAnswer)}
                  </div>
                ) : null}
                {isManual && (
                  <div className="rq-answer rq-manual-label">
                    <HelpCircle size={13} />Manual grading required
                  </div>
                )}
              </div> : null}

              {item.explanation ? (
                <p className="rq-explanation">💡 {item.explanation}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
