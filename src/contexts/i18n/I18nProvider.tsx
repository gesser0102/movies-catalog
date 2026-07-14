import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18nContextValue } from './I18nContext';
import { dictionaries, type Language } from './translations';

const STORAGE_KEY = 'movies-catalog:language';

/**
 * Descobre o idioma inicial na seguinte ordem de prioridade:
 *   1. o que o usuário já escolheu antes (localStorage).
 *   2. o idioma do navegador, se for português.
 *   3. inglês como padrão.
 */
function detectInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en-US' || stored === 'pt-BR') return stored;

  return navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  // Memoizado pra não recriar o objeto de contexto a cada render.
  const value = useMemo<I18nContextValue>(
    () => ({ language, t: dictionaries[language], setLanguage }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
