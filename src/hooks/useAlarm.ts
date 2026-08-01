import { useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { Finished } from '../types/timer';

let audio: HTMLAudioElement | null = null;

function playFile(path: string) {
  audio?.pause();
  audio = new Audio(convertFileSrc(path));
  void audio.play().catch(console.error);
}

/** Default alarm: gentle three-note chime via WebAudio — no bundled asset needed. */
export function playChime() {
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const now = ctx.currentTime;
  [880, 660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = now + i * 0.22;
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.5);
  });
  setTimeout(() => void ctx.close(), 2200);
}

/** Plays the alarm whenever a session finishes: custom file if set, chime otherwise. */
export function useAlarm(lastFinished: Finished | null) {
  useEffect(() => {
    if (!lastFinished) return;
    if (lastFinished.soundPath) playFile(lastFinished.soundPath);
    else playChime();
  }, [lastFinished]);
}
