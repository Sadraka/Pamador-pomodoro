use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Mode {
    Focus,
    ShortBreak,
    LongBreak,
}

#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Status {
    Idle,
    Running,
    Paused,
}

#[derive(Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub focus_secs: u64,
    pub short_break_secs: u64,
    pub long_break_secs: u64,
    /// None = default bundled alarm; Some(path) = user-chosen .mp3/.wav
    pub sound_path: Option<String>,
    /// When true, restore/raise the window when the timer finishes.
    pub raise_on_finish: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            focus_secs: 25 * 60,
            short_break_secs: 5 * 60,
            long_break_secs: 15 * 60,
            sound_path: None,
            raise_on_finish: true,
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub mode: Mode,
    pub status: Status,
    pub remaining_secs: u64,
    pub focus_count: u64,
    pub settings: Settings,
}

/// Payload of the `timer-finished` event.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Finished {
    pub mode: Mode,
    pub sound_path: Option<String>,
    pub raise_on_finish: bool,
}

pub struct TimerState {
    mode: Mode,
    status: Status,
    remaining_secs: u64,
    deadline: Option<Instant>,
    focus_count: u64,
    settings: Settings,
}

impl Default for TimerState {
    fn default() -> Self {
        let settings = Settings::default();
        Self {
            mode: Mode::Focus,
            status: Status::Idle,
            remaining_secs: settings.focus_secs,
            deadline: None,
            focus_count: 0,
            settings,
        }
    }
}

impl TimerState {
    pub fn snapshot(&self) -> Snapshot {
        Snapshot {
            mode: self.mode,
            status: self.status,
            remaining_secs: self.remaining_secs,
            focus_count: self.focus_count,
            settings: self.settings.clone(),
        }
    }

    pub fn is_running(&self) -> bool {
        self.status == Status::Running
    }

    fn duration_for(&self, mode: Mode) -> u64 {
        match mode {
            Mode::Focus => self.settings.focus_secs,
            Mode::ShortBreak => self.settings.short_break_secs,
            Mode::LongBreak => self.settings.long_break_secs,
        }
    }

    /// Advance to the next mode; every 4th finished focus is a long break.
    fn advance(&mut self) {
        self.mode = match self.mode {
            Mode::Focus => {
                self.focus_count += 1;
                if self.focus_count % 4 == 0 {
                    Mode::LongBreak
                } else {
                    Mode::ShortBreak
                }
            }
            Mode::ShortBreak | Mode::LongBreak => Mode::Focus,
        };
    }

    /// Seconds until the deadline, rounded up (ceil): a session never ends
    /// early and the display never shows 0 while time remains.
    fn remaining_until(&self, now: Instant) -> u64 {
        match self.deadline {
            Some(d) => {
                let t = d.saturating_duration_since(now);
                t.as_secs() + u64::from(t.subsec_nanos() > 0)
            }
            None => self.remaining_secs,
        }
    }

    pub fn start(&mut self) -> Snapshot {
        if !self.is_running() {
            self.deadline = Some(Instant::now() + Duration::from_secs(self.remaining_secs));
            self.status = Status::Running;
            // Update remaining immediately so the display counts down right away.
            self.remaining_secs = self.remaining_until(Instant::now());
        }
        self.snapshot()
    }

    pub fn pause(&mut self) -> Snapshot {
        if self.is_running() {
            self.remaining_secs = self.remaining_until(Instant::now());
            self.deadline = None;
            self.status = Status::Paused;
        }
        self.snapshot()
    }

    pub fn reset(&mut self) -> Snapshot {
        self.deadline = None;
        self.status = Status::Idle;
        self.remaining_secs = self.duration_for(self.mode);
        self.snapshot()
    }

    pub fn skip(&mut self) -> Snapshot {
        self.deadline = None;
        self.advance();
        self.status = Status::Idle;
        self.remaining_secs = self.duration_for(self.mode);
        self.snapshot()
    }

    /// Manual mode switch (clicking a mode tab): stops the current session.
    pub fn set_mode(&mut self, mode: Mode) -> Snapshot {
        self.mode = mode;
        self.deadline = None;
        self.status = Status::Idle;
        self.remaining_secs = self.duration_for(mode);
        self.snapshot()
    }

    pub fn update_settings(&mut self, settings: Settings) -> Snapshot {
        let was_running = self.is_running();
        self.settings = settings;
        if !was_running {
            self.remaining_secs = self.duration_for(self.mode);
        }
        self.snapshot()
    }

    /// Called once per second. Returns `Finished` when a session ended
    /// (state has already advanced to the next mode, idle).
    pub fn tick(&mut self) -> Option<Finished> {
        if !self.is_running() {
            return None;
        }
        let now = Instant::now();
        let remaining = self.remaining_until(now);
        if remaining > 0 {
            self.remaining_secs = remaining;
            return None;
        }
        let finished = Finished {
            mode: self.mode,
            sound_path: self.settings.sound_path.clone(),
            raise_on_finish: self.settings.raise_on_finish,
        };
        self.advance();
        self.deadline = None;
        self.status = Status::Idle;
        self.remaining_secs = self.duration_for(self.mode);
        Some(finished)
    }
}

pub type SharedState = Arc<Mutex<TimerState>>;

#[tauri::command]
pub fn get_state(state: State<'_, SharedState>) -> Snapshot {
    state.lock().unwrap().snapshot()
}

#[tauri::command]
pub fn start_timer(state: State<'_, SharedState>) -> Snapshot {
    state.lock().unwrap().start()
}

#[tauri::command]
pub fn pause_timer(state: State<'_, SharedState>) -> Snapshot {
    state.lock().unwrap().pause()
}

#[tauri::command]
pub fn reset_timer(state: State<'_, SharedState>) -> Snapshot {
    state.lock().unwrap().reset()
}

#[tauri::command]
pub fn skip_timer(state: State<'_, SharedState>) -> Snapshot {
    state.lock().unwrap().skip()
}

#[tauri::command]
pub fn set_mode(state: State<'_, SharedState>, mode: Mode) -> Snapshot {
    state.lock().unwrap().set_mode(mode)
}

#[tauri::command]
pub fn update_settings(state: State<'_, SharedState>, settings: Settings) -> Snapshot {
    state.lock().unwrap().update_settings(settings)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fast_settings() -> Settings {
        Settings {
            focus_secs: 3,
            short_break_secs: 2,
            long_break_secs: 2,
            sound_path: Some("C:/alarm.mp3".into()),
            raise_on_finish: true,
        }
    }

    #[test]
    fn defaults_and_skip() {
        let s = TimerState::default().snapshot();
        assert_eq!(s.mode, Mode::Focus);
        assert_eq!(s.status, Status::Idle);
        assert_eq!(s.remaining_secs, 25 * 60);
        assert!(s.settings.sound_path.is_none());

        let mut t = TimerState::default();
        assert_eq!(t.skip().mode, Mode::ShortBreak);
        assert_eq!(t.snapshot().focus_count, 1);
        assert_eq!(t.skip().mode, Mode::Focus);
    }

    #[test]
    fn finish_advances_and_carries_sound_path() {
        let mut t = TimerState::default();
        t.update_settings(fast_settings());
        assert_eq!(t.snapshot().remaining_secs, 3); // settings apply when idle
        t.start();
        assert_eq!(t.snapshot().status, Status::Running);
        std::thread::sleep(Duration::from_millis(3500));
        let f = t.tick().expect("session should finish");
        assert_eq!(f.mode, Mode::Focus);
        assert_eq!(f.sound_path.as_deref(), Some("C:/alarm.mp3"));
        let s = t.snapshot();
        assert_eq!(s.mode, Mode::ShortBreak);
        assert_eq!(s.status, Status::Idle);
        assert_eq!(s.remaining_secs, 2);
    }

    #[test]
    fn pause_resume_preserves_remaining() {
        let mut t = TimerState::default();
        t.update_settings(fast_settings());
        t.start();
        std::thread::sleep(Duration::from_millis(500));
        let s = t.pause();
        assert_eq!(s.status, Status::Paused);
        assert_eq!(s.remaining_secs, 3); // ceil(3s - 0.5s)

        let s = t.start();
        assert_eq!(s.status, Status::Running);
        assert!(t.tick().is_none()); // resume keeps the remaining time
        assert_eq!(t.snapshot().remaining_secs, 3);
        std::thread::sleep(Duration::from_millis(3200));
        assert!(t.tick().is_some()); // finished
        assert_eq!(t.snapshot().mode, Mode::ShortBreak);
    }

    #[test]
    fn every_fourth_focus_is_long_break() {
        let mut t = TimerState::default();
        t.update_settings(fast_settings());
        t.focus_count = 3;
        t.start();
        std::thread::sleep(Duration::from_millis(3500));
        let f = t.tick().expect("finish");
        assert_eq!(f.mode, Mode::Focus);
        assert_eq!(t.snapshot().mode, Mode::LongBreak);
        assert_eq!(t.snapshot().focus_count, 4);
    }

    #[test]
    fn set_mode_switches_and_stops() {
        let mut t = TimerState::default();
        t.start();
        let s = t.set_mode(Mode::LongBreak);
        assert_eq!(s.mode, Mode::LongBreak);
        assert_eq!(s.status, Status::Idle);
        assert_eq!(s.remaining_secs, 15 * 60);
        assert!(!t.is_running());
        assert_eq!(t.set_mode(Mode::Focus).remaining_secs, 25 * 60);
    }

    #[test]
    fn settings_do_not_affect_running_session() {
        let mut t = TimerState::default();
        t.update_settings(fast_settings());
        t.start();
        std::thread::sleep(Duration::from_millis(500));
        let s = t.update_settings(Settings {
            focus_secs: 999,
            short_break_secs: 2,
            long_break_secs: 2,
            sound_path: None,
            raise_on_finish: false,
        });
        assert_eq!(s.status, Status::Running);
        assert_eq!(s.remaining_secs, 3); // old session untouched
        assert_eq!(s.settings.focus_secs, 999); // new settings stored
    }
}
