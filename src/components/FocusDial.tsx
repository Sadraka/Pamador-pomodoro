import { useCallback, useEffect, useRef, useState } from 'react';
import type { TKey } from '../i18n/messages';
import { useI18n } from '../i18n/LanguageContext';
import { toFaDigits } from '../utils/format';

const PRESETS = [15, 20, 25, 30]; // minutes
const MIN_STEP = 1; // minutes
const CLAMP_MIN = 60; // 1 minute
const CLAMP_MAX = 99 * 60 + 59; // 99:59

const clamp = (n: number) => Math.min(CLAMP_MAX, Math.max(CLAMP_MIN, n));

interface FocusDialProps {
  value: number; // seconds
  onChange: (secs: number) => void;
  visible: boolean;
  /** i18n key for the accessible label, e.g. 'focusDuration' or 'shortBreakDuration'. */
  labelKey?: TKey;
}

export default function FocusDial({ value, onChange, visible, labelKey = 'focusDuration' }: FocusDialProps) {
  const { lang, t } = useI18n();

  const minutes = Math.floor(value / 60);
  // Display value uses the active locale (Persian digits in fa); editing uses
  // Latin so typing works naturally.
  const display = lang === 'fa' ? toFaDigits(minutes) : String(minutes);
  const [text, setText] = useState(display);
  const [editing, setEditing] = useState(false);
  const timerRef = useRef<number | null>(null);
  // Tracks the latest committed minutes so hold-repeat reads current state.
  const lastRef = useRef(minutes);

  // Keep the input in sync with the prop (e.g. preset click / reset).
  useEffect(() => {
    lastRef.current = minutes;
    if (!editing) {
      setText(lang === 'fa' ? toFaDigits(minutes) : String(minutes));
    }
  }, [minutes, editing, lang]);

  // Normalize any locale digits (Persian ۰-۹) to Latin so Number() parses them.
  const toLatin = useCallback(
    (raw: string) =>
      raw.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))),
    [],
  );

  const commit = useCallback(
    (raw: string) => {
      const n = Number(toLatin(raw));
      if (!Number.isNaN(n) && n >= 1 && n <= 99) {
        const secs = clamp(n * 60);
        lastRef.current = Math.floor(secs / 60);
        onChange(secs);
        setText(lang === 'fa' ? toFaDigits(lastRef.current) : String(lastRef.current));
      } else {
        setText(lang === 'fa' ? toFaDigits(lastRef.current) : String(lastRef.current));
      }
    },
    [onChange, toLatin, lang],
  );

  // Hold-to-repeat: start on pointer down, stop on up/leave/cancel.
  const hold = useCallback(
    (dir: number) => {
      const next = clamp((lastRef.current + dir * MIN_STEP) * 60);
      lastRef.current = Math.floor(next / 60);
      onChange(next);
      setText(lang === 'fa' ? toFaDigits(lastRef.current) : String(lastRef.current));
      timerRef.current = window.setInterval(() => {
        const n = clamp((lastRef.current + dir * MIN_STEP) * 60);
        lastRef.current = Math.floor(n / 60);
        onChange(n);
        setText(lang === 'fa' ? toFaDigits(lastRef.current) : String(lastRef.current));
      }, 90);
    },
    [onChange, lang],
  );

  const release = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => release, [release]);

  return (
    <div
      className={`focus-dial${visible ? '' : ' focus-dial--hidden'}`}
      role="group"
      aria-label={t(labelKey)}
      aria-hidden={!visible}
    >
      <div className="dial__row">
        <div className="stepper">
          <button
            type="button"
            className="step"
            aria-label={`${t('minutes')} -1`}
            onPointerDown={(e) => {
              e.preventDefault();
              hold(-1);
            }}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
            onContextMenu={(e) => e.preventDefault()}
          >
            −
          </button>
          <input
            className="dial__value"
            dir="ltr"
            inputMode="numeric"
            aria-label={t('minutes')}
            value={text}
            onFocus={() => setEditing(true)}
            onChange={(e) => {
              setText(e.target.value);
              commit(e.target.value);
            }}
            onBlur={() => {
              setEditing(false);
              setText(lang === 'fa' ? toFaDigits(Math.floor(value / 60)) : String(Math.floor(value / 60)));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <button
            type="button"
            className="step"
            aria-label={`${t('minutes')} +1`}
            onPointerDown={(e) => {
              e.preventDefault();
              hold(1);
            }}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
            onContextMenu={(e) => e.preventDefault()}
          >
            +
          </button>
        </div>
        <span className="dial__label">{t('minutes')}</span>
      </div>
      <div className="chips chips--presets" role="group" aria-label={t(labelKey)}>
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            className={`chip${value === m * 60 ? ' chip--active' : ''}`}
            aria-pressed={value === m * 60}
            onClick={() => onChange(m * 60)}
          >
            {toFaDigits(m)}
          </button>
        ))}
      </div>
    </div>
  );
}
