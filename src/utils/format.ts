import type { Language } from '@/contexts/i18n/translations';

// Funções de formatação reutilizáveis.

// Nota da TMDB vem com casas decimais longas (7.3666...). Arredonda pra 1 casa.
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

function parseDateOnly(isoDate: string): Date | null {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

// Formata a data conforme o locale ativo; devolve null se a data for inválida.
export function formatReleaseDate(
  isoDate: string | undefined,
  language: Language,
): string | null {
  if (!isoDate) return null;
  const date = parseDateOnly(isoDate);
  if (!date) return null;

  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Converte minutos em "2h 15min"
export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}min`;
}
