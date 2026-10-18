import type { Locale } from '@/constants/i18n';
import { en } from '@/i18n/dictionaries/en';
import { ru } from '@/i18n/dictionaries/ru';

type TranslationDictionary = {
  [Section in keyof typeof en]: {
    [Key in keyof (typeof en)[Section]]: string;
  };
};

export const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  ru,
};

export type TranslationKey = keyof typeof en;

export type TranslationPath = {
  [K in keyof typeof en]: K extends string
    ? keyof (typeof en)[K] extends string
      ? `${K}.${keyof (typeof en)[K]}`
      : never
    : never;
}[keyof typeof en];

function getNestedValue(
  dictionary: TranslationDictionary,
  key: TranslationPath,
): string {
  const [section, entry] = key.split('.') as [keyof typeof en, string];
  const sectionValues = dictionary[section] as
    | Record<string, string>
    | undefined;
  return sectionValues?.[entry] ?? key;
}

export function getTranslation(locale: Locale, key: TranslationPath): string {
  const fallback = getNestedValue(en, key);
  const dictionary = dictionaries[locale] ?? en;
  const translation = getNestedValue(dictionary, key);
  return translation === key ? fallback : translation;
}

export type TranslationParams = Record<string, string | number>;

/** Replaces `{name}` placeholders with values from `params`. */
export function interpolate(text: string, params?: TranslationParams): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

type PluralCategory = 'one' | 'few' | 'many';

/**
 * CLDR-style plural category. Russian distinguishes one / few / many
 * (1 трек, 3 трека, 5 треков); English only one / other (mapped to many).
 */
export function pluralCategory(locale: Locale, count: number): PluralCategory {
  const n = Math.abs(Math.trunc(count));
  if (locale === 'ru') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'one';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
    return 'many';
  }
  return n === 1 ? 'one' : 'many';
}

type CountSection = (typeof en)['count'];

/** Base names of plural entries: `tracks` for `tracks_one/_few/_many`. */
export type CountKey = {
  [K in keyof CountSection]: K extends `${infer Base}_one` ? Base : never;
}[keyof CountSection];

export function getCountTranslation(
  locale: Locale,
  key: CountKey,
  count: number,
): string {
  const path =
    `count.${key}_${pluralCategory(locale, count)}` as TranslationPath;
  return interpolate(getTranslation(locale, path), { count });
}
