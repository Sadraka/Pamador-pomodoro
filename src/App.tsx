import { useState } from 'react';
import Header from './components/Header';
import ModeTabs from './components/ModeTabs';
import TimerRing from './components/TimerRing';
import Controls from './components/Controls';
import FocusDial from './components/FocusDial';
import SoundSettingsModal from './components/SoundSettingsModal';
import { usePomodoro } from './hooks/usePomodoro';
import { useAlarm } from './hooks/useAlarm';
import type { Settings } from './types/timer';

export default function App() {
  const { snapshot, lastFinished, start, pause, reset, skip, setMode, updateSettings } =
    usePomodoro();
  const [focusCustom, setFocusCustom] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showFocusDial, setShowFocusDial] = useState(false);

  // Rust-side pomodoro alarm (plays on `timer-finished`).
  useAlarm(lastFinished);

  const activeMode = snapshot?.mode ?? 'focus';
  const status = snapshot?.status ?? 'idle';
  const dialValue = focusCustom ?? snapshot?.settings.focusSecs ?? 25 * 60;
  const isIdle = status === 'idle';
  const showDial = activeMode === 'focus' && isIdle && showFocusDial;

  const handleStart = async () => {
    if (focusCustom !== null && snapshot) {
      await updateSettings({ ...snapshot.settings, focusSecs: focusCustom });
      setFocusCustom(null);
    }
    setShowFocusDial(false);
    void start();
  };

  const handleSaveSound = async (partial: Partial<Settings>) => {
    if (!snapshot) return;
    await updateSettings({ ...snapshot.settings, ...partial });
  };

  const handleOpenFocusDial = () => {
    if (isIdle && activeMode === 'focus') {
      setShowFocusDial(true);
    }
  };

  return (
    <div className="app">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <ModeTabs mode={activeMode} onSelect={setMode} />
      <main className="app__body">
        <TimerRing
          snapshot={snapshot}
          displaySecs={showDial ? dialValue : undefined}
          dial={showDial}
          showGear={isIdle && activeMode === 'focus' && !showDial}
          onGearClick={handleOpenFocusDial}
        />
        <FocusDial value={dialValue} onChange={setFocusCustom} visible={showDial} />
        <Controls
          snapshot={snapshot}
          onStart={handleStart}
          onPause={pause}
          onReset={reset}
          onSkip={skip}
        />
      </main>
      {settingsOpen && snapshot && (
        <SoundSettingsModal
          snapshot={snapshot}
          onSave={handleSaveSound}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
