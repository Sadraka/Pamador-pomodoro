import type { Finished, Mode, Settings, Snapshot, Status } from '../types/timer';
import type { PlatformBackend } from './platform';

// Mirror of src-tauri/src/timer.rs — same semantics for shells without Rust
// (Capacitor/Android, plain browser). Deadline-based like the Rust Instant
// version, so throttled JS timers only delay the *notice*, never drift.

const SETTINGS_KEY = 'pamador.settings';
const TICK_MS = 250; // check often; remaining is computed from the deadline

export const defaultSettings: Settings = {
  focusSecs: 25 * 60,
  shortBreakSecs: 5 * 60,
  soundPath: null,
  raiseOnFinish: true,
};

type Listener<T> = Set<(payload: T) => void>;

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    /* best-effort persistence, like save_settings() */
  }
  return { ...defaultSettings };
}

/** Seconds until the deadline, rounded up: a session never ends early. */
function remainingUntil(deadline: number | null, fallback: number): number {
  if (deadline === null) return fallback;
  const ms = Math.max(0, deadline - Date.now());
  return Math.floor(ms / 1000) + (ms % 1000 > 0 ? 1 : 0);
}

/**
 * Pure-TS port of TimerState. Same command surface as the Tauri backend;
 `onTimer` fires once per second while running, `onFinished` on session end.
 */
export class JsTimerEngine implements PlatformBackend {
  private mode: Mode = 'focus';
  private status: Status = 'idle';
  private remainingSecs: number;
  private deadline: number | null = null;
  private focusCount = 0;
  private settings: Settings;
  private interval: number | null = null;

  private timerListeners: Listener<Snapshot> = new Set();
  private finishedListeners: Listener<Finished> = new Set();

  constructor() {
    this.settings = loadSettings();
    this.remainingSecs = this.durationFor(this.mode);
  }

  // ── queries ────────────────────────────────────────────────────────────

  getSnapshot(): Promise<Snapshot> {
    return Promise.resolve(this.snapshot());
  }

  private snapshot(): Snapshot {
    return {
      mode: this.mode,
      status: this.status,
      remainingSecs: this.remainingSecs,
      focusCount: this.focusCount,
      settings: { ...this.settings },
    };
  }

  private durationFor(mode: Mode): number {
    return mode === 'focus' ? this.settings.focusSecs : this.settings.shortBreakSecs;
  }

  // ── commands ───────────────────────────────────────────────────────────

  start(): Promise<Snapshot> {
    if (this.status !== 'running') {
      this.deadline = Date.now() + this.remainingSecs * 1000;
      this.status = 'running';
      this.remainingSecs = remainingUntil(this.deadline, this.remainingSecs);
      this.ensureTicking();
    }
    return Promise.resolve(this.snapshot());
  }

  pause(): Promise<Snapshot> {
    if (this.status === 'running') {
      this.remainingSecs = remainingUntil(this.deadline, this.remainingSecs);
      this.deadline = null;
      this.status = 'paused';
    }
    return Promise.resolve(this.snapshot());
  }

  reset(): Promise<Snapshot> {
    this.deadline = null;
    this.status = 'idle';
    this.remainingSecs = this.durationFor(this.mode);
    return Promise.resolve(this.snapshot());
  }

  skip(): Promise<Snapshot> {
    this.deadline = null;
    this.advance();
    this.status = 'idle';
    this.remainingSecs = this.durationFor(this.mode);
    return Promise.resolve(this.snapshot());
  }

  setMode(mode: Mode): Promise<Snapshot> {
    // Manual mode switch stops the current session.
    this.mode = mode;
    this.deadline = null;
    this.status = 'idle';
    this.remainingSecs = this.durationFor(mode);
    return Promise.resolve(this.snapshot());
  }

  updateSettings(settings: Settings): Promise<Snapshot> {
    const wasRunning = this.status === 'running';
    this.settings = { ...settings };
    this.saveSettings();
    if (!wasRunning) {
      this.remainingSecs = this.durationFor(this.mode);
    }
    return Promise.resolve(this.snapshot());
  }

  // ── ticking ────────────────────────────────────────────────────────────

  private ensureTicking() {
    if (this.interval !== null) return;
    this.interval = window.setInterval(() => this.tick(), TICK_MS);
  }

  private stopTicking() {
    if (this.interval !== null) {
      window.clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** Advance time; emit once per whole second; emit Finished on session end. */
  private tick() {
    if (this.status !== 'running') {
      this.stopTicking();
      return;
    }
    const remaining = remainingUntil(this.deadline, this.remainingSecs);
    if (remaining > 0) {
      if (remaining !== this.remainingSecs) {
        this.remainingSecs = remaining;
        this.emitTimer();
      }
      return;
    }
    const finished: Finished = {
      mode: this.mode,
      soundPath: this.settings.soundPath,
      raiseOnFinish: this.settings.raiseOnFinish,
    };
    this.advance();
    this.deadline = null;
    this.status = 'idle';
    this.remainingSecs = this.durationFor(this.mode);
    this.stopTicking();
    this.emitTimer();
    this.finishedListeners.forEach((cb) => cb(finished));
  }

  private emitTimer() {
    const snap = this.snapshot();
    this.timerListeners.forEach((cb) => cb(snap));
  }

  /** focus → short break (focus_count += 1) → focus. */
  private advance() {
    if (this.mode === 'focus') {
      this.focusCount += 1;
      this.mode = 'shortBreak';
    } else {
      this.mode = 'focus';
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      /* best-effort */
    }
  }

  // ── subscriptions ──────────────────────────────────────────────────────

  onTimer(cb: (s: Snapshot) => void): () => void {
    this.timerListeners.add(cb);
    return () => this.timerListeners.delete(cb);
  }

  onFinished(cb: (f: Finished) => void): () => void {
    this.finishedListeners.add(cb);
    return () => this.finishedListeners.delete(cb);
  }

  // ── shell capabilities ────────────────────────────────────────────────

  /**
   * Pick an audio file and store it as a data URL (self-contained, survives
   * restarts via localStorage, no filesystem access needed in a WebView).
   */
  async pickAudioFile(): Promise<string | null> {
    const file = await new Promise<File | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*,.mp3,.wav,.ogg,.m4a';
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.oncancel = () => resolve(null);
      input.click();
    });
    if (!file) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  audioSrcFor(soundRef: string): string {
    return soundRef; // data URLs pass through untouched
  }
}
