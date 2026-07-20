import { Bot, CalendarClock, CheckCircle2, ExternalLink, Loader2, Send, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import classesApi from "../lib/classes-api";
import { CLASS_WRITE_ROLES, type TutorRequest } from "../types/class";

type Props = { classId: string };
type Answers = { topic: string; challenge: string; attempted: string; desiredOutcome: string };

const QUESTIONS: { key: keyof Answers; prompt: string; placeholder: string }[] = [
  { key: "topic", prompt: "Which lesson or topic are you working on?", placeholder: "e.g. Coordinate systems" },
  { key: "challenge", prompt: "Where exactly are you stuck, and what happens?", placeholder: "Describe the problem or error" },
  { key: "attempted", prompt: "What have you already tried?", placeholder: "Steps, examples, or resources you tried" },
  { key: "desiredOutcome", prompt: "What would a successful result look like?", placeholder: "What you want to be able to do" },
];

function botAdvice(answers: Answers) {
  return `For “${answers.topic}”, break the task into one small reproducible example. Compare the result you get with “${answers.desiredOutcome}”, then check the first step where they differ. Since you tried ${answers.attempted}, write down any exact error message and the input that caused it. Does this help you move forward?`;
}

export function TutorSupportPanel({ classId }: Props) {
  const { token, user } = useAuth();
  const canTutor = Boolean(user && CLASS_WRITE_ROLES.includes(user.role));
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<Answers>({ topic: "", challenge: "", attempted: "", desiredOutcome: "" });
  const [advice, setAdvice] = useState("");
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    if (!token) return;
    void classesApi.listTutorRequests(token, classId).then(setRequests).catch(() => setError("Could not load tutor requests."));
  };
  useEffect(load, [classId, token]);

  function submitAnswer(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim()) return;
    const next = { ...answers, [QUESTIONS[step].key]: answer.trim() };
    setAnswers(next);
    setAnswer("");
    if (step === QUESTIONS.length - 1) setAdvice(botAdvice(next));
    else setStep((current) => current + 1);
  }

  async function requestTutor() {
    if (!token) return;
    setBusy("create");
    setError("");
    try {
      const created = await classesApi.createTutorRequest(token, classId, { ...answers, botSummary: advice });
      setRequests((current) => [created, ...current]);
      setAdvice("");
      setStep(0);
      setAnswers({ topic: "", challenge: "", attempted: "", desiredOutcome: "" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not request a tutor.");
    } finally {
      setBusy("");
    }
  }

  async function propose(requestId: string) {
    if (!token) return;
    const values = slots[requestId] ?? ["", "", ""];
    if (values.some((value) => !value)) return;
    setBusy(requestId);
    try {
      const updated = await classesApi.proposeTutorSlots(token, requestId, values.map((value) => new Date(value).toISOString()));
      setRequests((current) => current.map((item) => item.id === requestId ? updated : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send availability.");
    } finally { setBusy(""); }
  }

  async function select(requestId: string, selectedStart: string) {
    if (!token) return;
    setBusy(requestId);
    try {
      const updated = await classesApi.selectTutorSlot(token, requestId, selectedStart);
      setRequests((current) => current.map((item) => item.id === requestId ? updated : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not select that time.");
    } finally { setBusy(""); }
  }

  async function saveLink(requestId: string) {
    if (!token || !links[requestId]) return;
    setBusy(requestId);
    try {
      const updated = await classesApi.setTutorMeetingLink(token, requestId, links[requestId]);
      setRequests((current) => current.map((item) => item.id === requestId ? updated : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the meeting link.");
    } finally { setBusy(""); }
  }

  return (
    <div className="tutor-support-layout">
      {!canTutor && (
        <section className="admin-card tutor-chatbot">
          <div className="admin-card-header"><h3><Bot size={18} /> Tutor support assistant</h3><small>Let’s understand the issue first</small></div>
          {!advice ? (
            <form onSubmit={submitAnswer}>
              <div className="tutor-bot-message"><Bot size={18} /><p>{QUESTIONS[step].prompt}</p></div>
              <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder={QUESTIONS[step].placeholder} rows={3} />
              <button className="primary-button" disabled={!answer.trim()}><Send size={15} /> Continue</button>
            </form>
          ) : (
            <div className="tutor-advice">
              <div className="tutor-bot-message"><Bot size={18} /><p>{advice}</p></div>
              <div className="modal-actions">
                <button className="secondary-button" onClick={() => { setAdvice(""); setStep(0); }}>Yes, start again</button>
                <button className="primary-button" onClick={() => void requestTutor()} disabled={busy === "create"}>
                  {busy === "create" ? <Loader2 className="spin" size={16} /> : <Video size={16} />} No, request live tutor
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="tutor-request-list">
        <h3>{canTutor ? "Learner tutor requests" : "My tutor requests"}</h3>
        {error ? <p className="form-error">{error}</p> : null}
        {requests.length === 0 ? <p className="muted-panel">No tutor requests yet.</p> : requests.map((request) => (
          <article className="admin-card tutor-request-card" key={request.id}>
            <header><div><strong>{request.topic}</strong>{canTutor ? <span>{request.student.fullName}</span> : null}</div><b>{request.status.replaceAll("_", " ")}</b></header>
            <p><strong>Challenge:</strong> {request.challenge}</p>
            <p><strong>Tried:</strong> {request.attempted}</p>
            <p><strong>Goal:</strong> {request.desiredOutcome}</p>

            {canTutor && request.status === "REQUESTED" ? (
              <div className="tutor-slot-editor">
                <p><CalendarClock size={16} /> Offer exactly three available times</p>
                {[0, 1, 2].map((index) => (
                  <input key={index} type="datetime-local" value={(slots[request.id] ?? ["", "", ""])[index]}
                    onChange={(event) => setSlots((current) => {
                      const next = [...(current[request.id] ?? ["", "", ""])];
                      next[index] = event.target.value;
                      return { ...current, [request.id]: next };
                    })} />
                ))}
                <button className="primary-button" onClick={() => void propose(request.id)} disabled={busy === request.id}>Send options</button>
              </div>
            ) : null}

            {!canTutor && request.status === "AWAITING_SELECTION" ? (
              <div className="tutor-slot-options">
                <strong>Choose a time:</strong>
                {request.proposedSlots.map((slot) => (
                  <button className="secondary-button" key={slot} onClick={() => void select(request.id, slot)} disabled={busy === request.id}>
                    {new Date(slot).toLocaleString()}
                  </button>
                ))}
              </div>
            ) : null}

            {request.selectedStart ? <p><CheckCircle2 size={15} /> Scheduled for {new Date(request.selectedStart).toLocaleString()}</p> : null}
            {request.selectedStart && !request.meetingUrl ? (
              <div className="tutor-link-editor">
                <input type="url" placeholder="Paste Google Meet, Zoom, or Teams link" value={links[request.id] ?? ""} onChange={(event) => setLinks((current) => ({ ...current, [request.id]: event.target.value }))} />
                <button className="primary-button" onClick={() => void saveLink(request.id)} disabled={!links[request.id] || busy === request.id}>Save meeting link</button>
              </div>
            ) : null}
            {request.meetingUrl ? <a className="primary-button small-button" href={request.meetingUrl} target="_blank" rel="noreferrer">Join meeting <ExternalLink size={13} /></a> : null}
          </article>
        ))}
      </section>
    </div>
  );
}
