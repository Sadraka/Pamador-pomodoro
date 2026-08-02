import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import type { Settings, Snapshot } from '../types/timer';
import { useI18n } from '../i18n/LanguageContext';

interface Props {
  snapshot: Snapshot | null;
  onSave: (settings: Partial<Settings>) => void;
  onClose: () => void;
}

export default function SoundSettingsModal({ snapshot, onSave, onClose }: Props) {
  const { t } = useI18n();
  const current = snapshot?.settings.soundPath ?? null;
  const currentRaise = snapshot?.settings.raiseOnFinish ?? true;
  const [picked, setPicked] = useState<string | null>(current);
  const [raise, setRaise] = useState<boolean>(currentRaise);

  const chooseFile = async () => {
    const file = await open({
      multiple: false,
      filters: [
        { name: t('audioFiles'), extensions: ['mp3', 'wav', 'ogg', 'm4a'] },
      ],
    });
    if (typeof file === 'string') setPicked(file);
  };

  const close = () => {
    onClose();
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={t('soundSettings')}>
      <div className="modal__backdrop" onClick={close} />
      <div className="modal__panel">
        <div className="modal__head">
          <h2 className="modal__title">{t('soundSettings')}</h2>
          <button type="button" className="icon-btn modal__close" onClick={close} aria-label={t('close')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal__body">
          <div className="sound-row">
            <span className="sound-row__label">{t('alarmSound')}</span>
            <span className="sound-row__value">
              {picked ? t('customSound') : t('defaultSound')}
            </span>
          </div>

          <div className="sound-actions">
            <button type="button" className="btn" onClick={chooseFile}>
              {t('chooseSound')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setPicked(null)}
              disabled={!picked}
            >
              {t('defaultSound')}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setPicked(null)}
              disabled={!picked}
            >
              {t('removeSound')}
            </button>
          </div>

          {picked && <div className="sound-file">{picked}</div>}

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={raise}
              onChange={(e) => setRaise(e.target.checked)}
            />
            <span className="toggle-row__track" aria-hidden="true" />
            <span className="toggle-row__label">{t('raiseOnFinish')}</span>
          </label>
        </div>

        <div className="modal__foot">
          <button type="button" className="btn" onClick={close}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onSave({ soundPath: picked, raiseOnFinish: raise });
              close();
            }}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
