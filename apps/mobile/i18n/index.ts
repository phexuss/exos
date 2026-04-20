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
