import { useContext } from 'react';
import { I18nContext, type I18nContextValue } from './I18nContext';

/**
 * acesso ao I18n, garante que o componente esteja dentro do provider em runtime
 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n precisa ser usado dentro de <I18nProvider>.');
  }
  return ctx;
}
