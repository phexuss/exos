import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  DEFAULT_LOCALE,
  type Locale,
  STORAGE_KEY,
  SUPPORTED_LOCALES,
} from '@/constants/i18n';
import { getTranslation, type TranslationPath } from '@/i18n';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  t: (key: TranslationPath) => string;
};

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let isMounted = true;
    const loadLocale = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted || !stored) {
          return;
        }
        if (SUPPORTED_LOCALES.includes(stored as Locale)) {
          setLocaleState(stored as Locale);
        }
      } catch {}
    };
    loadLocale();
    return () => {
      isMounted = false;
    };
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    AsyncStorage.setItem(STORAGE_KEY, nextLocale).catch(() => undefined);
  }, []);

  const t = useCallback(
    (key: TranslationPath) => getTranslation(locale, key),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
