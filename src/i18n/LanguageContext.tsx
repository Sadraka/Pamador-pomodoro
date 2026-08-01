import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { messages, type Lang, type TKey } from './messages';
import { toFaDigits } from '../utils/format';

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
}

const Ctx = createContext<I18n | null>(null);
const STORAGE_KEY = 'pomodoro.lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(STORAGE_KEY) as Lang) || 'fa',
  );
  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);
  const dir: 'rtl' | 'ltr' = lang === 'fa' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => {
      const s = messages[lang][key];
      if (!vars) return s;
      return s.replace(/\{(\w+)\}/g, (_, k: string) => {
        const v = vars[k];
        if (v === undefined) return `{${k}}`;
        return lang === 'fa' ? toFaDigits(v) : String(v);
      });
    },
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}
