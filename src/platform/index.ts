import { detectPlatform, type PlatformBackend } from './platform';
import { tauriBackend } from './tauriBackend';
import { JsTimerEngine } from './jsTimerEngine';

let backend: PlatformBackend | null = null;

/** The shell-appropriate backend, created once per webview. */
export function getBackend(): PlatformBackend {
  if (!backend) {
    backend = detectPlatform() === 'tauri' ? tauriBackend : new JsTimerEngine();
  }
  return backend;
}
