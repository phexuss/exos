/**
 * Russian and English, same dictionaries shape as apps/mobile (section.key,
 * `{name}` placeholders, one/few/many plurals). The language lives in the
 * settings store, so changing it re-renders everything that called useT().
 */
import { useMemo } from 'react';
import { useSettings } from '@/store/settings';
import { en } from './en';
import type { Locale } from './locale';
import { ru } from './ru';

export type { Locale } from './locale';

const dictionaries: Record<Locale, typeof en> = { en, ru };

type Dict = typeof en;
export type Key = {
  [S in keyof Dict]: `${S & string}.${keyof Dict[S] & string}`;
}[keyof Dict];
type CountKey = {
  [K in keyof Dict['count']]: K extends `${infer Base}_one` ? Base : never;
}[keyof Dict['count']];
export type Params = Record<string, string | number>;

function lookup(locale: Locale, key: string): string {
  const [section, entry] = key.split('.');
  const pick = (d: Dict) => (d[section as keyof Dict] as Record<string, string> | undefined)?.[entry];
  return pick(dictionaries[locale]) ?? pick(en) ?? key;
}

function fill(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

function category(locale: Locale, n: number): 'one' | 'few' | 'many' {
  const abs = Math.abs(Math.trunc(n));
  if (locale !== 'ru') return abs === 1 ? 'one' : 'many';
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
  return 'many';
}

function make(locale: Locale) {
  const t = (key: Key, params?: Params) => fill(lookup(locale, key), params);
  const tn = (key: CountKey, n: number) => fill(lookup(locale, `count.${key}_${category(locale, n)}`), { n });
  return { locale, t, tn };
}

export const currentLocale = (): Locale => useSettings.getState().locale;

/** For code outside components (stores, toasts): reads the language at call time. */
export const t = (key: Key, params?: Params) => make(currentLocale()).t(key, params);
export const tn = (key: CountKey, n: number) => make(currentLocale()).tn(key, n);

/** For components: re-renders when the language changes. */
export function useT() {
  const locale = useSettings((s) => s.locale);
  return useMemo(() => make(locale), [locale]);
}
