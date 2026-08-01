import { usePomodoro } from './hooks/usePomodoro';
import { useI18n } from './i18n/LanguageContext';

export default function App() {
  const { snapshot, start, pause, reset, skip } = usePomodoro();
  const { lang, setLang, t } = useI18n();

  const mm = snapshot ? String(Math.floor(snapshot.remainingSecs / 60)).padStart(2, '0') : '--';
  const ss = snapshot ? String(snapshot.remainingSecs % 60).padStart(2, '0') : '--';

  return (
    <main>
      <button onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}>
        {lang === 'fa' ? 'EN' : 'FA'}
      </button>
      <h1>{t(snapshot?.mode ?? 'focus')}</h1>
      <p>
        {mm}:{ss} — {t(snapshot?.status ?? 'idle')}
      </p>
      <button onClick={start}>▶</button>
      <button onClick={pause}>⏸</button>
      <button onClick={reset}>↺</button>
      <button onClick={skip}>⏭</button>
    </main>
  );
}
