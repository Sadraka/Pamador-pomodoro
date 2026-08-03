import { useState } from 'react';
import Header from './components/Header';
import ModeTabs from './components/ModeTabs';
import TimerRing from './components/TimerRing';
import Controls from './components/Controls';
import FocusDial from './components/FocusDial';
import SoundSettingsModal from './components/SoundSettingsModal';
import { usePomodoro } from './hooks/usePomodoro';
import { useAlarm } from './hooks/useAlarm';
import type { Mode, Settings } from './types/timer';

export default function App() {
  const { snapshot, lastFinished, start, pause, reset, skip, setMode, updateSettings } =
    usePomodoro();
  // Pending custom duration per mode (null = keep the saved setting).
  const [dial, setDial] = useState<Record<Mode, number | null>>({ focus: null, shortBreak: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showDial, setShowDial] = useState<Mode | null>(null);

  // Rust-side pomodoro alarm (plays on `timer-finished`).
  useAlarm(lastFinished);

  const activeMode = snapshot?.mode ?? 'focus';
  const status = snapshot?.status ?? 'idle';
  const isIdle = status === 'idle';
  const dialVisible = isIdle && showDial === activeMode;

  const settingKey = activeMode === 'focus' ? 'focusSecs' : 'shortBreakSecs';
  const fallback = activeMode === 'focus' ? 25 * 60 : 5 * 60;
  const dialValue = dial[activeMode] ?? snapshot?.settings[settingKey] ?? fallback;

  const handleStart = async () => {
    if (snapshot && dial[activeMode] !== null) {
      if (activeMode === 'focus') {
        await updateSettings({ ...snapshot.settings, focusSecs: dial.focus ?? snapshot.settings.focusSecs });
      } else {
        await updateSettings({ ...snapshot.settings, shortBreakSecs: dial.shortBreak ?? snapshot.settings.shortBreakSecs });
      }
      setDial((d) => ({ ...d, [activeMode]: null }));
    }
    setShowDial(null);
    void start();
  };

  const handleSaveSound = async (partial: Partial<Settings>) => {
    if (!snapshot) return;
    await updateSettings({ ...snapshot.settings, ...partial });
  };

  const handleOpenDial = (mode: Mode) => {
    if (isIdle && (mode === 'focus' || mode === 'shortBreak')) {
      setShowDial(mode);
    }
  };

  return (
    <div className="app">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <ModeTabs mode={activeMode} onSelect={setMode} />
      <main className="app__body">
        <TimerRing
          snapshot={snapshot}
          displaySecs={dialVisible ? dialValue : undefined}
          dial={dialVisible}
          showGear={isIdle && (activeMode === 'focus' || activeMode === 'shortBreak') && !dialVisible}
          onGearClick={() => handleOpenDial(activeMode)}
        />
        <FocusDial
          value={dialValue}
          labelKey={activeMode === 'focus' ? 'focusDuration' : 'shortBreakDuration'}
          onChange={(secs) => setDial((d) => ({ ...d, [activeMode]: secs }))}
          visible={dialVisible}
        />
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
