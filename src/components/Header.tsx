import { useI18n } from '../i18n/LanguageContext';

function TomatoIcon() {
  return (
    <svg
      className="app__tomato"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="14" rx="9" ry="9" fill="oklch(62% 0.22 25)" />
      <path
        d="M12 5c-1.5 0-3 0.8-4 2M12 5c1.5 0 3 0.8 4 2M12 5V2"
        stroke="oklch(35% 0.12 140)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface HeaderProps {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="app__head">
      <div className="app__wordmark">
        <TomatoIcon />
        {t('appName')}
      </div>
      <div className="app__head-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSettings}
          aria-label={t('settings')}
          title={t('settings')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
          aria-label={lang === 'fa' ? 'English' : 'فارسی'}
        >
          <span className="icon-btn__text">{lang === 'fa' ? 'EN' : 'FA'}</span>
        </button>
      </div>
    </header>
  );
}
