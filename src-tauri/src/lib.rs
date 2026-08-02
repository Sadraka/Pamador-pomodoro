mod timer;

use std::sync::{Arc, Mutex};
use std::time::Duration;

use tauri::{Emitter, Manager};

fn spawn_ticker(app: tauri::AppHandle, state: timer::SharedState) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(1));
        let mut s = state.lock().unwrap();
        let finished = s.tick();
        let changed = s.is_running() || finished.is_some();
        let snapshot = s.snapshot();
        drop(s);
        if changed {
            let _ = app.emit("timer", snapshot);
        }
        if let Some(f) = finished {
            let should_raise = f.raise_on_finish;
            let _ = app.emit("timer-finished", f);
            // Restore/raise the window when the timer finishes.
            if should_raise {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
    });
}

#[tauri::command]
fn close_splashscreen(app: tauri::AppHandle) {
    if let Some(splashscreen) = app.get_webview_window("splashscreen") {
        let _ = splashscreen.close();
    }
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let state: timer::SharedState = Arc::new(Mutex::new(timer::TimerState::default()));
            app.manage(state.clone());
            spawn_ticker(app.handle().clone(), state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            close_splashscreen,
            timer::get_state,
            timer::start_timer,
            timer::pause_timer,
            timer::reset_timer,
            timer::skip_timer,
            timer::set_mode,
            timer::update_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
