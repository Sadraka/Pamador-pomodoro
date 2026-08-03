import type { Mode } from '../types/timer';
import { useI18n } from '../i18n/LanguageContext';

const MODES: Mode[] = ['focus', 'shortBreak'];

export default function ModeTabs({ mode, onSelect }: { mode: Mode; onSelect: (m: Mode) => void }) {
  const { t } = useI18n();

  return (
    <div className="mode-tabs" role="group" aria-label={t('mode')}>
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          className={`mode-tab${m === mode ? ' mode-tab--active' : ''}`}
          aria-pressed={m === mode}
          onClick={() => onSelect(m)}
        >
          {t(m)}
        </button>
      ))}
    </div>
  );
}
