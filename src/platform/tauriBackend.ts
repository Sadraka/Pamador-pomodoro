import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import type { Finished, Mode, Settings, Snapshot } from '../types/timer';
import type { PlatformBackend } from './platform';

/** Tauri shell: timer state lives in Rust; we invoke commands and listen. */
export const tauriBackend: PlatformBackend = {
  getSnapshot: () => invoke<Snapshot>('get_state'),
  start: () => run('start_timer'),
  pause: () => run('pause_timer'),
  reset: () => run('reset_timer'),
  skip: () => run('skip_timer'),
  setMode: (mode: Mode) => run('set_mode', { mode }),
  updateSettings: (settings: Settings) => run('update_settings', { settings }),

  onTimer: (cb) => {
    const un = listen<Snapshot>('timer', (e) => cb(e.payload));
    return () => void un.then((fn) => fn());
  },
  onFinished: (cb) => {
    const un = listen<Finished>('timer-finished', (e) => cb(e.payload));
    return () => void un.then((fn) => fn());
  },

  pickAudioFile: async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }],
    });
    return typeof file === 'string' ? file : null;
  },
  audioSrcFor: (soundRef) => convertFileSrc(soundRef),

  closeSplashscreen: () => {
    void invoke('close_splashscreen').catch(console.error);
  },
};

async function run(cmd: string, args?: Record<string, unknown>): Promise<Snapshot> {
  return invoke<Snapshot>(cmd, args);
}
