export type Locale = 'en' | 'ru';

/** First run: the system language if it is Russian, English otherwise. */
export function systemLocale(): Locale {
  const lang = typeof navigator === 'undefined' ? '' : navigator.language;
  return lang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
