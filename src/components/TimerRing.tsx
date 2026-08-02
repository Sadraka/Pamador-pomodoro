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
  showGear,
  onGearClick,
}: {
  snapshot: Snapshot | null;
  displaySecs?: number;
  dial?: boolean;
  showGear?: boolean;
  onGearClick?: () => void;
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
        <span className={`ring__time${paused ? ' ring__time--paused' : ''}`} dir="ltr">
          {text}
        </span>
        {showGear && (
          <button
            type="button"
            className="ring__gear"
            onClick={onGearClick}
            aria-label={t('customize')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span className="ring__gear-label">{t('customize')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
