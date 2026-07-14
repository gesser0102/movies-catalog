import { createContext } from 'react';
import type { Language, Translation } from './translations';

/**
 * Valor exposto pelo contexto de idioma.
 *
 * `t` é o dicionário do idioma ativo (acesso direto: t.nav.movies). `language`
 * também vai pras requests da TMDB, por isso ele fica no contexto e não só a
 * função de tradução.
 */
export interface I18nContextValue {
  language: Language;
  t: Translation;
  setLanguage: (language: Language) => void;
}

/**
 * Contexto fica num arquivo separado (sem componente) de propósito: misturar a
 * criação do contexto com o componente Provider atrapalha o Fast Refresh do vite.
 */
export const I18nContext = createContext<I18nContextValue | undefined>(undefined);
