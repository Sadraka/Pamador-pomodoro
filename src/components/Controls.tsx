import type { Snapshot } from '../types/timer';
import { useI18n } from '../i18n/LanguageContext';

interface ControlsProps {
  snapshot: Snapshot | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export default function Controls({ snapshot, onStart, onPause, onReset, onSkip }: ControlsProps) {
  const { t } = useI18n();
  const status = snapshot?.status;

  return (
    <div className="controls">
      <button
        type="button"
        className="btn btn--primary"
        onClick={onStart}
        disabled={status === 'running'}
        aria-disabled={status === 'running'}
      >
        {status === 'paused' ? t('resume') : t('start')}
      </button>
      <button
        type="button"
        className="btn"
        onClick={onPause}
        disabled={status !== 'running'}
        aria-disabled={status !== 'running'}
      >
        {t('pause')}
      </button>
      <button type="button" className="btn" onClick={onReset} disabled={!snapshot}>
        {t('reset')}
      </button>
      <button type="button" className="btn btn--ghost" onClick={onSkip} disabled={!snapshot}>
        {t('skip')}
      </button>
    </div>
  );
}
