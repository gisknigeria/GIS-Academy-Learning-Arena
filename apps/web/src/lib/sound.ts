/**
 * SoundManager — lightweight Web Audio API sound engine.
 *
 * Generates tones procedurally (no audio files required).
 * Respects prefers-reduced-motion and a user-controllable mute flag.
 */

const STORAGE_KEY = "gis_arena_sound";

let audioCtx: AudioContext | null = null;
let muted = localStorage.getItem(STORAGE_KEY) === "off";

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (typeof AudioContext === "undefined") return null;
  if (!audioCtx || audioCtx.state === "closed") {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.3,
  startDelay = 0,
) {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);

  gainNode.gain.setValueAtTime(0, ctx.currentTime + startDelay);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startDelay + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration + 0.05);
}

// ─── Sound effects ────────────────────────────────────────────────────────────

export const sounds = {
  /** Soft click for tile selection */
  click() {
    playTone(660, 0.06, "sine", 0.18);
  },

  /** Rising tone: puzzle tile solved */
  tileSuccess() {
    playTone(523, 0.12, "sine", 0.22);
    playTone(659, 0.18, "sine", 0.22, 0.1);
  },

  /** Tri-tone fanfare: quest complete */
  questComplete() {
    playTone(523, 0.14, "sine", 0.3);
    playTone(659, 0.14, "sine", 0.3, 0.14);
    playTone(784, 0.24, "sine", 0.3, 0.28);
  },

  /** Celebratory chord: streak milestone */
  streakMilestone() {
    playTone(523, 0.2, "triangle", 0.25);
    playTone(659, 0.2, "triangle", 0.2, 0.04);
    playTone(784, 0.3, "triangle", 0.15, 0.08);
    playTone(1047, 0.4, "sine", 0.22, 0.16);
  },

  /** Badge earned */
  badgeEarned() {
    playTone(880, 0.1, "sine", 0.2);
    playTone(1047, 0.2, "sine", 0.25, 0.1);
  },

  /** Lesson completed */
  lessonComplete() {
    playTone(392, 0.14, "sine", 0.22);
    playTone(523, 0.14, "sine", 0.22, 0.15);
    playTone(659, 0.22, "sine", 0.28, 0.3);
  },

  /** Wrong answer */
  wrong() {
    playTone(220, 0.12, "sawtooth", 0.15);
    playTone(196, 0.18, "sawtooth", 0.12, 0.1);
  },

  /** Arena join — suspenseful low pulse */
  arenaJoin() {
    playTone(146, 0.18, "triangle", 0.2);
    playTone(196, 0.18, "triangle", 0.18, 0.22);
  },
};

// ─── Mute control ─────────────────────────────────────────────────────────────

export function isSoundEnabled(): boolean {
  return !muted;
}

export function toggleSound(): boolean {
  muted = !muted;
  localStorage.setItem(STORAGE_KEY, muted ? "off" : "on");
  return !muted;
}
