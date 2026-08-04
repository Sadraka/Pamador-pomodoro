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
  const running = status === 'running';
  const primaryLabel = running ? t('pause') : status === 'paused' ? t('resume') : t('start');
  const primaryAction = running ? onPause : onStart;

  return (
    <div className="controls">
      <button
        type="button"
        className="controls__ghost"
        onClick={onReset}
        disabled={!snapshot}
        aria-label={t('reset')}
        title={t('reset')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      <button
        type="button"
        className="controls__main"
        onClick={primaryAction}
        aria-label={primaryLabel}
        title={primaryLabel}
      >
        <svg
          className="controls__main-icon"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          {running ? (
            <>
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </>
          ) : (
            <path d="M7 4.5a1 1 0 0 1 1.52-.86l12 7.5a1 1 0 0 1 0 1.72l-12 7.5A1 1 0 0 1 7 19.5v-15Z" />
          )}
        </svg>
      </button>
      <button
        type="button"
        className="controls__ghost"
        onClick={onSkip}
        disabled={!snapshot}
        aria-label={t('skip')}
        title={t('skip')}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 5.5a1 1 0 0 1 1.53-.85L16 10v-4a1 1 0 0 1 2 0v12a1 1 0 0 1-2 0v-4L6.53 19.35A1 1 0 0 1 5 18.5v-13Z" />
        </svg>
      </button>
    </div>
  );
}
