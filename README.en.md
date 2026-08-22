# Pamador 🍅

<p align="center">
  <a href="README.md">فارسی</a>
</p>

**Pamador** is a Pomodoro timer for desktop and Android — built with **Tauri 2**, **Capacitor** and **React**.

<p align="center">
  <img src="docs/en.png" alt="Pamador app screenshot" width="320">
</p>

## Download

Grab the latest build from the [Releases](https://github.com/Sadraka/Pamador-pomodoro/releases) page:

- **Windows**: `pamador-x.y.z-windows-x64.exe`
- **Android**: `pamador-x.y.z-android.apk` (Android 7+)

## Pamador Pomodoro Timer Features

- Two timer modes: Focus and Short Break
- Set focus duration from 1 to 99 minutes, or pick a quick preset
- Custom alarm sound (your own audio file, or the built-in default)
- Settings persist automatically — your choices are kept between launches
- Bilingual: Persian and English
- When the timer finishes, the window restores itself if minimized (toggleable)
- Hides to the system tray; closing the window doesn't stop the timer

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript |
| Styling | Hand-written CSS, Vazirmatn font |
| Desktop backend | Rust (Tauri 2) |
| Android backend | Capacitor |
| Build | Vite |

## Run & Build

Prerequisites: [Node.js](https://nodejs.org), [Rust](https://rustup.rs), and [Android Studio](https://developer.android.com/studio) for the Android build.

```bash
npm install

# Desktop dev mode — changes apply automatically
npm run tauri dev

# Production desktop build — beforeBuildCommand builds the frontend itself
npx tauri build --no-bundle
```

Output: `src-tauri/target/release/pamador.exe`

### Android

```bash
# Build the web assets and sync them into the Android project
npm run cap:sync

# Run on a connected device/emulator
npm run cap:run

# Or open the project in Android Studio
npm run cap:android
```

Release builds are signed via `assembleRelease`; signing credentials are read from `android/keystore.properties` (not committed).

## Project Structure

```
src/                  # Shared frontend (React)
  components/         # UI components
  hooks/              # Backend bridge & audio playback logic
  i18n/               # Persian / English translations
  platform/           # Platform abstraction: Tauri / JS timer engine
src-tauri/
  src/timer.rs        # Timer logic and settings persistence (desktop)
  src/lib.rs          # Windows, tray and events
android/              # Capacitor Android project
```

## How the Pamador Timer Works

On desktop, the timer logic runs in Rust, not JavaScript. A background thread checks the state every second and notifies the frontend via events. On Android the same behavior is reproduced by a TypeScript port of that logic — both use an absolute deadline so counting stays accurate even if the system stalls.

## License

Free to use — no specific license.
