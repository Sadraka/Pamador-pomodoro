import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Finished, Mode, Settings, Snapshot } from '../types/timer';

const TIMER_EVENT = 'timer';
const FINISHED_EVENT = 'timer-finished';

export function usePomodoro() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [lastFinished, setLastFinished] = useState<Finished | null>(null);

  useEffect(() => {
    let disposed = false;
    invoke<Snapshot>('get_state')
      .then((s) => {
        if (!disposed) setSnapshot(s);
      })
      .catch(console.error);
    const unTimer = listen<Snapshot>(TIMER_EVENT, (e) => setSnapshot(e.payload));
    const unFinished = listen<Finished>(FINISHED_EVENT, (e) => setLastFinished(e.payload));
    return () => {
      disposed = true;
      unTimer.then((fn) => fn());
      unFinished.then((fn) => fn());
    };
  }, []);

  const run = useCallback(async (cmd: string, args?: Record<string, unknown>) => {
    const s = await invoke<Snapshot>(cmd, args);
    setSnapshot(s);
    return s;
  }, []);

  const start = useCallback(() => run('start_timer'), [run]);
  const pause = useCallback(() => run('pause_timer'), [run]);
  const reset = useCallback(() => run('reset_timer'), [run]);
  const skip = useCallback(() => run('skip_timer'), [run]);
  const setMode = useCallback((mode: Mode) => run('set_mode', { mode }), [run]);
  const updateSettings = useCallback(
    (settings: Settings) => run('update_settings', { settings }),
    [run],
  );

  return {
    snapshot,
    lastFinished,
    clearFinished: () => setLastFinished(null),
    start,
    pause,
    reset,
    skip,
    setMode,
    updateSettings,
  };
}
