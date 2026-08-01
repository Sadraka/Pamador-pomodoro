import { useState } from 'react';
import Header from './components/Header';
import ModeTabs from './components/ModeTabs';
import TimerRing from './components/TimerRing';
import Controls from './components/Controls';
import FocusDial from './components/FocusDial';
import { usePomodoro } from './hooks/usePomodoro';
import { useAlarm } from './hooks/useAlarm';

export default function App() {
  const { snapshot, lastFinished, start, pause, reset, skip, setMode, updateSettings } =
    usePomodoro();
  const [focusCustom, setFocusCustom] = useState<number | null>(null);

  // Rust-side pomodoro alarm (plays on `timer-finished`).
  useAlarm(lastFinished);

  const activeMode = snapshot?.mode ?? 'focus';
  const status = snapshot?.status ?? 'idle';
  const dialValue = focusCustom ?? snapshot?.settings.focusSecs ?? 25 * 60;
  const showDial = activeMode === 'focus' && status === 'idle';

  const handleStart = async () => {
    if (focusCustom !== null && snapshot) {
      await updateSettings({ ...snapshot.settings, focusSecs: focusCustom });
      setFocusCustom(null);
    }
    void start();
  };

  return (
    <div className="app">
      <Header />
      <main className="app__body">
        <ModeTabs mode={activeMode} onSelect={setMode} />
        <TimerRing
          snapshot={snapshot}
          displaySecs={showDial ? dialValue : undefined}
          dial={showDial}
        />
        {showDial && <FocusDial value={dialValue} onChange={setFocusCustom} />}
        <Controls
          snapshot={snapshot}
          onStart={handleStart}
          onPause={pause}
          onReset={reset}
          onSkip={skip}
        />
      </main>
    </div>
  );
}
