/**
 * The engine's own messages (errors that end up in the window's toasts) in
 * the window's language. Every call from the window carries it along.
 */
let locale: 'ru' | 'en' = 'ru';

export function setLocale(lang: unknown) {
  if (lang === 'ru' || lang === 'en') locale = lang;
}

/** L('по-русски', 'in English') */
export const L = (ru: string, en: string) => (locale === 'en' ? en : ru);
