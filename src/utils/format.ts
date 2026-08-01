import type { Lang } from '../i18n/messages';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Convert Latin digits to Persian (used for every number in fa mode). */
export const toFaDigits = (s: string | number): string =>
  String(s).replace(/\d/g, (d) => FA_DIGITS[+d]);

/** mm:ss for display; Persian digits in fa. */
export function formatTime(totalSecs: number, lang: Lang): string {
  const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
  const ss = String(totalSecs % 60).padStart(2, '0');
  const t = `${mm}:${ss}`;
  return lang === 'fa' ? toFaDigits(t) : t;
}
