// Mirror of src-tauri/src/timer.rs (serde camelCase)

export type Mode = 'focus' | 'shortBreak' | 'longBreak';
export type Status = 'idle' | 'running' | 'paused';

export interface Settings {
  focusSecs: number;
  shortBreakSecs: number;
  longBreakSecs: number;
  soundPath: string | null;
  raiseOnFinish: boolean;
}

export interface Snapshot {
  mode: Mode;
  status: Status;
  remainingSecs: number;
  focusCount: number;
  settings: Settings;
}

export interface Finished {
  mode: Mode;
  soundPath: string | null;
  raiseOnFinish: boolean;
}
