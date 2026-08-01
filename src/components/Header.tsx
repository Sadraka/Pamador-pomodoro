import { useI18n } from '../i18n/LanguageContext';

export default function Header() {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="app__head">
      <div className="app__wordmark">
        <span className="app__mark" aria-hidden="true" />
        {t('appName')}
      </div>
      <div className="app__head-actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
          aria-label={lang === 'fa' ? 'English' : 'فارسی'}
        >
          {lang === 'fa' ? 'EN' : 'FA'}
        </button>
      </div>
    </header>
  );
}
