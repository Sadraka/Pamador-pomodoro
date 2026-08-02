<a id="fa"></a>

# پامادور 🍅

**پامادور** یک تایمر پومودورو برای دسکتاپ است — ساخته‌شده با **Tauri 2** و **React**.

**خواندن به زبان دیگر:** [English](#pamador) · [فارسی](#fa)

## امکانات تایمر پومودورو پامادور

- سه حالت تایمر: تمرکز، استراحت کوتاه، استراحت بلند
- تنظیم زمان تمرکز از ۱ تا ۹۹ دقیقه یا انتخاب از پیشنهادهای سریع
- صدای سفارشی برای آلارم (فایل صوتی دلخواه یا صدای پیش‌فرض)
- ذخیرهٔ خودکار تنظیمات — هر چیزی که بچینید، بعد از بستن برنامه حفظ می‌شود
- دوزبانه: فارسی و انگلیسی
- در صورت پایان تایمر، پنجره از حالت کوچک‌شده برمی‌گردد (قابل تنظیم)

## تکنولوژی‌ها

| لایه | فناوری |
|------|--------|
| رابط کاربری | React 19 + TypeScript |
| ظاهر | CSS اختصاصی، فونت وزیرمتن |
| بدنه | Rust (Tauri 2) |
| ساخت | Vite |

## اجرا و بیلد

پیش‌نیاز: [Node.js](https://nodejs.org) و [Rust](https://rustup.rs).

```bash
npm install

# حالت توسعه — تغییرات به‌صورت خودکار اعمال می‌شود
npm run tauri dev

# بیلد نهایی
npm run build
npx tauri build --no-bundle
```

خروجی: `src-tauri/target/release/pamador.exe`

## ساختار پروژه

```
src/                  # فرانت (React)
  components/         # اجزای رابط کاربری
  hooks/              # منطق اتصال به Rust و پخش صدا
  i18n/               # ترجمهٔ فارسی و انگلیسی
src-tauri/
  src/timer.rs        # منطق تایمر و ذخیرهٔ تنظیمات
  src/lib.rs          # پنجره‌ها و رویدادها
```

## تایمر پامادور چطور کار می‌کند؟

منطق تایمر در Rust اجرا می‌شود، نه جاوااسکریپت. یک نخ پس‌زمینه هر ثانیه وضعیت را بررسی و از طریق رویداد به فرانت اطلاع می‌دهد؛ به همین دلیل تایمر حتی در شرایط سنگین هم دقیق است.

## مجوز

آزاد — بدون مجوز مشخص.

---

<a id="pamador"></a>

# Pamador 🍅

**Pamador** is a Pomodoro timer for the desktop — built with **Tauri 2** and **React**.

## Pamador Pomodoro Timer Features

- Three timer modes: Focus, Short Break, Long Break
- Set focus duration from 1 to 99 minutes, or pick a quick preset
- Custom alarm sound (your own audio file, or the built-in default)
- Settings persist automatically — your choices are kept between launches
- Bilingual: Persian and English
- When the timer finishes, the window restores itself if minimized (toggleable)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript |
| Styling | Hand-written CSS, Vazirmatn font |
| Backend | Rust (Tauri 2) |
| Build | Vite |

## Run & Build

Prerequisites: [Node.js](https://nodejs.org) and [Rust](https://rustup.rs).

```bash
npm install

# Development mode — changes apply automatically
npm run tauri dev

# Production build
npm run build
npx tauri build --no-bundle
```

Output: `src-tauri/target/release/pamador.exe`

## Project Structure

```
src/                  # Frontend (React)
  components/         # UI components
  hooks/              # Rust bridge & audio playback logic
  i18n/               # Persian / English translations
src-tauri/
  src/timer.rs        # Timer logic and settings persistence
  src/lib.rs          # Windows and events
```

## How the Pamador Timer Works

The timer logic runs in Rust, not JavaScript. A background thread checks the state every second and notifies the frontend via events; that's why the timer stays accurate even under heavy load.

## License

Free to use — no specific license.
