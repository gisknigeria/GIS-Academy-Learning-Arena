import { BookOpen, Camera, ExternalLink, Loader2, MonitorUp, Pencil, Square, VideoOff } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { SectionHeading } from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../lib/api";
import classesApi from "../lib/classes-api";
import type { LiveSession } from "../types/class";

type Participant = {
  socketId: string;
  displayName?: string;
  role?: string;
};

type RemoteStream = Participant & {
  stream: MediaStream;
};

const SIGNAL_URL = API_BASE_URL.replace(/\/api\/?$/, "");

function buildRtcConfig(): RTCConfiguration {
  const turnUrls = String(import.meta.env.VITE_TURN_URLS ?? import.meta.env.VITE_TURN_URL ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;
  const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

  if (turnUrls.length > 0 && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return { iceServers };
}

const rtcConfig = buildRtcConfig();

function RemoteVideo({ peer }: { peer: RemoteStream }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = peer.stream;
  }, [peer.stream]);

  return (
    <div className="live-video-tile">
      <video ref={ref} autoPlay playsInline />
      <span>{peer.displayName || "Participant"}</span>
    </div>
  );
}

export function LiveSessionPage() {
  const { sessionId } = useParams();
  const { token, user } = useAuth();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream>(new MediaStream());
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (!token || !sessionId) return;
    void classesApi.getLiveSession(token, sessionId).then(setSession).catch(() => setError("Could not load live session."));
  }, [sessionId, token]);

  useEffect(() => {
    if (!sessionId || !token || !user) return;
    const socket = io(`${SIGNAL_URL}/live-sessions`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-session", { sessionId, displayName: user.fullName, role: user.role });
    });

    socket.on("session-participants", (existing: Participant[]) => {
      setParticipants(existing);
      existing.forEach((participant) => void createOffer(participant.socketId, participant));
    });

    socket.on("participant-joined", (participant: Participant) => {
      setParticipants((current) => [...current.filter((item) => item.socketId !== participant.socketId), participant]);
    });

    socket.on("participant-left", ({ socketId }: { socketId: string }) => {
      peersRef.current.get(socketId)?.close();
      peersRef.current.delete(socketId);
      setParticipants((current) => current.filter((item) => item.socketId !== socketId));
      setRemoteStreams((current) => current.filter((item) => item.socketId !== socketId));
    });

    socket.on("webrtc-offer", async ({ from, participant, description }: { from: string; participant?: Participant; description: RTCSessionDescriptionInit }) => {
      const peer = createPeer(from, participant);
      await peer.setRemoteDescription(description);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("webrtc-answer", { to: from, description: answer });
    });

    socket.on("webrtc-answer", async ({ from, description }: { from: string; description: RTCSessionDescriptionInit }) => {
      const peer = peersRef.current.get(from);
      if (peer) await peer.setRemoteDescription(description);
    });

    socket.on("webrtc-ice", async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current.get(from);
      if (peer && candidate) await peer.addIceCandidate(candidate);
    });

    socket.on("whiteboard-draw", drawRemotePoint);
    socket.on("whiteboard-clear", clearWhiteboardLocal);

    return () => {
      socket.disconnect();
      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();
    };
  }, [sessionId, token, user]);

  function createPeer(peerId: string, participant?: Participant) {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing;

    const peer = new RTCPeerConnection(rtcConfig);
    peersRef.current.set(peerId, peer);
    localStreamRef.current.getTracks().forEach((track) => peer.addTrack(track, localStreamRef.current));

    peer.onicecandidate = (event) => {
      if (event.candidate) socketRef.current?.emit("webrtc-ice", { to: peerId, candidate: event.candidate });
    };

    peer.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      setRemoteStreams((current) => [
        ...current.filter((item) => item.socketId !== peerId),
        { socketId: peerId, displayName: participant?.displayName, role: participant?.role, stream },
      ]);
    };

    return peer;
  }

  async function createOffer(peerId: string, participant?: Participant) {
    const peer = createPeer(peerId, participant);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current?.emit("webrtc-offer", { to: peerId, description: offer });
  }

  async function renegotiateAll() {
    for (const [peerId, peer] of peersRef.current.entries()) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current?.emit("webrtc-offer", { to: peerId, description: offer });
    }
  }

  function replaceOutgoingVideoTrack(track: MediaStreamTrack | null) {
    peersRef.current.forEach((peer) => {
      const sender = peer.getSenders().find((item) => item.track?.kind === "video");
      if (sender) void sender.replaceTrack(track);
    });
  }

  async function toggleCamera() {
    if (cameraOn) {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      localStreamRef.current.getVideoTracks().forEach((track) => localStreamRef.current.removeTrack(track));
      localStreamRef.current.getAudioTracks().forEach((track) => localStreamRef.current.removeTrack(track));
      if (videoRef.current) videoRef.current.srcObject = null;
      if (!screenOn) replaceOutgoingVideoTrack(null);
      setCameraOn(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    cameraStreamRef.current = stream;
    stream.getTracks().forEach((track) => localStreamRef.current.addTrack(track));
    if (videoRef.current) videoRef.current.srcObject = stream;
    if (!screenOn) {
      replaceOutgoingVideoTrack(stream.getVideoTracks()[0] ?? null);
      await renegotiateAll();
    }
    setCameraOn(true);
  }

  async function toggleScreen() {
    if (screenOn) {
      stopScreenShare();
      return;
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    screenStreamRef.current = stream;
    const screenTrack = stream.getVideoTracks()[0] ?? null;
    replaceOutgoingVideoTrack(screenTrack);
    await renegotiateAll();
    screenTrack?.addEventListener("ended", stopScreenShare);
    setScreenOn(true);
  }

  function stopScreenShare() {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    const cameraTrack = cameraStreamRef.current?.getVideoTracks()[0] ?? null;
    replaceOutgoingVideoTrack(cameraTrack);
    setScreenOn(false);
  }

  function drawPoint(point: { x: number; y: number; previousX?: number; previousY?: number }) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#167d44";
    ctx.beginPath();
    ctx.moveTo((point.previousX ?? point.x) * canvas.width, (point.previousY ?? point.y) * canvas.height);
    ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
    ctx.stroke();
  }

  function drawRemotePoint(point: { x: number; y: number; previousX?: number; previousY?: number }) {
    drawPoint(point);
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !drawing.current || !sessionId) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const previousX = Number(canvas.dataset.lastX ?? x);
    const previousY = Number(canvas.dataset.lastY ?? y);
    const point = { x, y, previousX, previousY };
    drawPoint(point);
    socketRef.current?.emit("whiteboard-draw", { sessionId, point });
    canvas.dataset.lastX = String(x);
    canvas.dataset.lastY = String(y);
  }

  function startDraw(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.dataset.lastX = String((event.clientX - rect.left) / rect.width);
    canvas.dataset.lastY = String((event.clientY - rect.top) / rect.height);
    drawing.current = true;
  }

  function clearWhiteboardLocal() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function clearWhiteboard() {
    clearWhiteboardLocal();
    if (sessionId) socketRef.current?.emit("whiteboard-clear", { sessionId });
  }

  if (error) return <p className="form-error">{error}</p>;
  if (!session) {
    return (
      <div className="page-loading">
        <Loader2 size={22} className="spin" />
        Loading live workspace...
      </div>
    );
  }

  return (
    <section className="module-page live-room-page">
      <SectionHeading eyebrow="Live workspace" title={session.title} />
      <div className="live-room-shell">
        <main className="live-stage">
          <div className="live-video-grid">
            <div className="live-video-tile">
              <video ref={videoRef} autoPlay playsInline muted />
              <span>{cameraOn ? "You" : "Camera off"}</span>
            </div>
            {remoteStreams.map((peer) => <RemoteVideo key={peer.socketId} peer={peer} />)}
            {remoteStreams.length === 0 ? (
              <div className="live-video-tile live-waiting-tile">
                <span>Waiting for others to join</span>
              </div>
            ) : null}
          </div>

          <div className="whiteboard-panel">
            <div className="whiteboard-toolbar">
              <strong><Pencil size={16} /> Shared whiteboard</strong>
              <button className="secondary-button small-button" onClick={clearWhiteboard}>Clear</button>
            </div>
            <canvas
              ref={canvasRef}
              width={1000}
              height={420}
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={() => { drawing.current = false; }}
              onPointerLeave={() => { drawing.current = false; }}
            />
          </div>
        </main>

        <aside className="live-side-panel">
          <div className="live-session-meta">
            <strong>{session.class.course.code} - {session.class.course.title}</strong>
            <span>{session.class.name}</span>
            <span>{new Date(session.startsAt).toLocaleString()}</span>
            <span>{participants.length + 1} participant{participants.length === 0 ? "" : "s"} in room</span>
            {session.description ? <p>{session.description}</p> : null}
          </div>
          {session.meetingUrl ? (
            <a className="primary-button" href={session.meetingUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={17} />
              Join meeting
            </a>
          ) : null}
          <button className="secondary-button" onClick={() => void toggleCamera()}>
            {cameraOn ? <VideoOff size={17} /> : <Camera size={17} />}
            {cameraOn ? "Stop camera" : "Start camera"}
          </button>
          <button className="secondary-button" onClick={() => void toggleScreen()}>
            {screenOn ? <Square size={17} /> : <MonitorUp size={17} />}
            {screenOn ? "Stop sharing" : "Share screen"}
          </button>
          {session.presentationUrl ? (
            <a className="secondary-button" href={session.presentationUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={17} />
              Open presentation
            </a>
          ) : null}
          {session.bookUrl ? (
            <a className="secondary-button" href={session.bookUrl} target="_blank" rel="noreferrer">
              <BookOpen size={17} />
              Open book
            </a>
          ) : null}
          <Link className="ghost-button" to={`/classes/${session.classId}`}>Back to class</Link>
        </aside>
      </div>
    </section>
  );
}
