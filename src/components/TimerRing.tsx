import type { Snapshot } from '../types/timer';
import { useI18n } from '../i18n/LanguageContext';
import { formatTime } from '../utils/format';

const R = 120;
const CIRC = 2 * Math.PI * R;

function totalSecs(s: Snapshot): number {
  if (s.mode === 'focus') return s.settings.focusSecs;
  if (s.mode === 'shortBreak') return s.settings.shortBreakSecs;
  return s.settings.longBreakSecs;
}

export default function TimerRing({
  snapshot,
  displaySecs,
  dial,
}: {
  snapshot: Snapshot | null;
  /** Preview override — shows a dial value on the idle Focus ring before Start. */
  displaySecs?: number;
  /** When true, the dial is open on the idle Focus ring → smaller ring. */
  dial?: boolean;
}) {
  const { lang, t } = useI18n();

  const total = displaySecs ?? (snapshot ? totalSecs(snapshot) : 1);
  const remaining = displaySecs ?? snapshot?.remainingSecs ?? 0;
  const frac = total > 0 ? remaining / total : 0;

  const text = formatTime(remaining, lang);
  const paused = snapshot?.status === 'paused';
  const label = displaySecs ? `${t('focus')} — ${text}` : snapshot ? `${t(snapshot.mode)} — ${text}` : t('focus');

  return (
    <div className={`ring${dial ? ' ring--dial' : ''}`} role="timer" aria-label={label}>
      <svg className="ring__svg" viewBox="0 0 260 260" aria-hidden="true">
        <circle className="ring__track" cx="130" cy="130" r={R} />
        <circle
          className={`ring__progress${paused ? ' ring__progress--paused' : ''}`}
          cx="130"
          cy="130"
          r={R}
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - frac)}
          transform="rotate(-90 130 130)"
        />
      </svg>
      <div className="ring__inner">
        <span className="ring__mode">{t(snapshot?.mode ?? 'focus')}</span>
        <span className={`ring__time${paused ? ' ring__time--paused' : ''}`} dir="ltr">
          {text}
        </span>
      </div>
    </div>
  );
}
