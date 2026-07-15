import { en } from './en';
import { ptBR } from './pt-BR';


export type Language = 'en-US' | 'pt-BR';

export function getAlternateLanguage(language: Language): Language {
  return language === 'pt-BR' ? 'en-US' : 'pt-BR';
}

export type Translation = typeof en;

export const dictionaries: Record<Language, Translation> = {
  'en-US': en,
  'pt-BR': ptBR,
};

export const LANGUAGE_OPTIONS: { value: Language; label: string; short: string }[] = [
  { value: 'en-US', label: 'English', short: 'EN' },
  { value: 'pt-BR', label: 'Português', short: 'PT' },
];
