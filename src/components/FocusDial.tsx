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
}

export default function FocusDial({ value, onChange, visible }: FocusDialProps) {
  const { t } = useI18n();

  const minutes = Math.floor(value / 60);
  const bump = (d: number) => onChange(clamp(value + d));

  return (
    <div
      className={`focus-dial${visible ? '' : ' focus-dial--hidden'}`}
      role="group"
      aria-label={t('focusDuration')}
      aria-hidden={!visible}
    >
      <div className="dial__row">
        <div className="stepper">
          <button
            type="button"
            className="step"
            aria-label={`${t('minutes')} -1`}
            onClick={() => bump(-MIN_STEP * 60)}
          >
            −
          </button>
          <span className="dial__value" dir="ltr">
            {toFaDigits(minutes)}
          </span>
          <button
            type="button"
            className="step"
            aria-label={`${t('minutes')} +1`}
            onClick={() => bump(MIN_STEP * 60)}
          >
            +
          </button>
        </div>
        <span className="dial__label">{t('minutes')}</span>
      </div>
      <div className="chips chips--presets" role="group" aria-label={t('focusDuration')}>
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
