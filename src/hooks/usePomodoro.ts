import { useCallback, useEffect, useState } from 'react';
import { getBackend } from '../platform';
import type { Finished, Mode, Settings, Snapshot } from '../types/timer';

export function usePomodoro() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [lastFinished, setLastFinished] = useState<Finished | null>(null);

  useEffect(() => {
    let disposed = false;

    // Desktop only: close the splash screen once React is mounted.
    // A short timeout guarantees the webview is ready before we dismiss it.
    const closeTimer = window.setTimeout(() => {
      getBackend().closeSplashscreen?.();
    }, 150);

    getBackend()
      .getSnapshot()
      .then((s) => {
        if (!disposed) setSnapshot(s);
      })
      .catch(console.error);
    const unTimer = getBackend().onTimer((s) => setSnapshot(s));
    const unFinished = getBackend().onFinished((f) => setLastFinished(f));
    return () => {
      disposed = true;
      window.clearTimeout(closeTimer);
      unTimer();
      unFinished();
    };
  }, []);

  const run = useCallback(
    async (action: (b: ReturnType<typeof getBackend>) => Promise<Snapshot>) => {
      setSnapshot(await action(getBackend()));
    },
    [],
  );

  const start = useCallback(() => run((b) => b.start()), [run]);
  const pause = useCallback(() => run((b) => b.pause()), [run]);
  const reset = useCallback(() => run((b) => b.reset()), [run]);
  const skip = useCallback(() => run((b) => b.skip()), [run]);
  const setMode = useCallback((mode: Mode) => run((b) => b.setMode(mode)), [run]);
  const updateSettings = useCallback(
    (settings: Settings) => run((b) => b.updateSettings(settings)),
    [run],
  );

  return {
    snapshot,
    lastFinished,
    start,
    pause,
    reset,
    skip,
    setMode,
    updateSettings,
  };
}
