mod timer;

use std::sync::{Arc, Mutex};
use std::time::Duration;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

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

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// System tray: left-click toggles the window, right-click menu lets the
/// user show/hide or fully quit.
fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "نمایش/مخفی‌کردن", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "خروج", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().cloned().expect("window icon missing"))
        .tooltip("پامادور")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(w) = app.get_webview_window("main") {
                    if w.is_visible().unwrap_or(false) {
                        let _ = w.hide();
                    } else {
                        show_main_window(app);
                    }
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

/// Called from the frontend once React is ready: closes the splash screen
/// and reveals the main window.
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
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // A second instance was launched: reveal the existing main window.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let _ = window.hide();
                    api.prevent_close();
                }
                tauri::WindowEvent::Resized(_) => {
                    if window.is_minimized().unwrap_or(false) {
                        let _ = window.hide();
                    }
                }
                _ => {}
            }
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Settings live in <app_data_dir>/settings.json so choices survive restarts.
            let app_data_dir = match app.path().app_data_dir() {
                Ok(dir) => Some(dir),
                Err(e) => {
                    log::error!("failed to resolve app_data_dir; settings persistence disabled: {e}");
                    None
                }
            };
            let state: timer::SharedState =
                Arc::new(Mutex::new(timer::TimerState::new_with_save_dir(app_data_dir.as_deref())));
            app.manage(state.clone());
            spawn_ticker(app.handle().clone(), state);
            let _ = build_tray(app.handle());
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
