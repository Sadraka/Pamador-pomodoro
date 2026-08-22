import type { Finished, Mode, Settings, Snapshot } from '../types/timer';

export type PlatformKind = 'tauri' | 'capacitor' | 'web';

/** Which shell is hosting the webview right now. */
export function detectPlatform(): PlatformKind {
  if ('__TAURI_INTERNALS__' in window) return 'tauri';
  if ('Capacitor' in window) return 'capacitor';
  return 'web';
}

export interface PlatformBackend {
  /** Current timer state (Tauri: get_state command). */
  getSnapshot(): Promise<Snapshot>;
  start(): Promise<Snapshot>;
  pause(): Promise<Snapshot>;
  reset(): Promise<Snapshot>;
  skip(): Promise<Snapshot>;
  setMode(mode: Mode): Promise<Snapshot>;
  updateSettings(settings: Settings): Promise<Snapshot>;

  /** Subscribe to per-second snapshots; returns an unsubscribe fn. */
  onTimer(cb: (s: Snapshot) => void): () => void;
  /** Subscribe to session-finish notifications. */
  onFinished(cb: (f: Finished) => void): () => void;

  /** Let the user pick an audio file; null = cancelled/unsupported. */
  pickAudioFile(): Promise<string | null>;
  /** Resolve a stored sound reference into something an <audio> can play. */
  audioSrcFor(soundRef: string): string;

  /** Desktop-only: dismiss the splashscreen window. */
  closeSplashscreen?(): void;
}
