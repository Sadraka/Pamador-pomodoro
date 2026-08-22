// Quick behavioral parity check for jsTimerEngine vs timer.rs semantics.
// Run: node scripts/test-js-timer-engine.mjs  (after a tsc build or via tsx)
import { execSync } from 'node:child_process';

const tmp = 'node_modules/.tmp-engine-test';
execSync(`npx tsc --ignoreConfig src/platform/jsTimerEngine.ts --outDir ${tmp} --module esnext --moduleResolution bundler --target es2022 --skipLibCheck`, { stdio: 'inherit', cwd: process.cwd() });

// Minimal DOM shims so the engine module can load under node.
globalThis.window = {
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id),
};
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => (store[k] = String(v)),
    removeItem: (k) => delete store[k],
    clear: () => (store = {}),
  };
})();

const { pathToFileURL } = await import('node:url');
// tsc preserves the common source root, so the file lands under platform/
const engineUrl = pathToFileURL(process.cwd() + `/${tmp}/platform/jsTimerEngine.js`).href;
const { JsTimerEngine } = await import(engineUrl);

let failures = 0;
function eq(actual, expected, label) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── defaults & skip ──────────────────────────────────────────────────────
{
  localStorage.clear();
  const t = new JsTimerEngine();
  let s = await t.getSnapshot();
  eq(s.mode, 'focus', 'default mode focus');
  eq(s.status, 'idle', 'default status idle');
  eq(s.remainingSecs, 25 * 60, 'default remaining 25m');
  eq(s.settings.soundPath, null, 'no default sound');
  eq((await t.skip()).mode, 'shortBreak', 'skip → shortBreak');
  eq((await t.getSnapshot()).focusCount, 1, 'focusCount after skip');
  eq((await t.skip()).mode, 'focus', 'skip again → focus');
}

// ── finish advances + carries sound + persistence reload ────────────────
{
  localStorage.clear();
  const t = new JsTimerEngine();
  await t.updateSettings({ focusSecs: 2, shortBreakSecs: 2, soundPath: 'data:audio/x', raiseOnFinish: false });
  eq((await t.getSnapshot()).remainingSecs, 2, 'settings apply when idle');
  await t.start();
  eq((await t.getSnapshot()).status, 'running', 'running after start');
  let finished = null;
  const off = t.onFinished((f) => (finished = f));
  await sleep(2600);
  t['tick'](); // force one tick past the deadline
  eq(finished?.mode, 'focus', 'finished payload mode');
  eq(finished?.soundPath, 'data:audio/x', 'finished carries sound');
  const s = await t.getSnapshot();
  eq(s.mode, 'shortBreak', 'advanced to short break');
  eq(s.status, 'idle', 'idle after finish');
  off();

  // New instance reads persisted settings back.
  const t2 = new JsTimerEngine();
  eq((await t2.getSnapshot()).settings.focusSecs, 2, 'settings persisted across instances');
}

// ── pause/resume preserves remaining (ceil) ─────────────────────────────
{
  localStorage.clear();
  const t = new JsTimerEngine();
  await t.updateSettings({ focusSecs: 3, shortBreakSecs: 2, soundPath: null, raiseOnFinish: true });
  await t.start();
  await sleep(500);
  const p = await t.pause();
  eq(p.status, 'paused', 'paused status');
  eq(p.remainingSecs, 3, 'ceil(3 - 0.5) = 3');
  const r = await t.start();
  eq(r.status, 'running', 'resumed');
  await sleep(3200);
  t['tick']();
  eq((await t.getSnapshot()).mode, 'shortBreak', 'finished after resume');
}

// ── set_mode stops the session ──────────────────────────────────────────
{
  localStorage.clear();
  const t = new JsTimerEngine();
  await t.start();
  const s = await t.setMode('shortBreak');
  eq(s.mode, 'shortBreak', 'set_mode switches');
  eq(s.status, 'idle', 'set_mode stops session');
  eq(s.remainingSecs, 5 * 60, 'remaining follows new mode default');
  eq((await t.setMode('focus')).remainingSecs, 25 * 60, 'back to focus');
}

// ── running session untouched by settings change ────────────────────────
{
  localStorage.clear();
  const t = new JsTimerEngine();
  await t.updateSettings({ focusSecs: 3, shortBreakSecs: 2, soundPath: null, raiseOnFinish: true });
  await t.start();
  await sleep(300);
  const s = await t.updateSettings({ focusSecs: 999, shortBreakSecs: 2, soundPath: null, raiseOnFinish: false });
  eq(s.status, 'running', 'still running after settings change');
  eq(s.remainingSecs, 3, 'old session untouched');
  eq(s.settings.focusSecs, 999, 'new settings stored');
}

console.log(failures === 0 ? '\nAll engine tests passed.' : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
