import { useContext } from 'react';

import { LanguageContext } from '@/providers/LanguageProvider';

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useI18n must be used within LanguageProvider');
  }
  return context;
}
