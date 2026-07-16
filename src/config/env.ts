/**
 * Ponto único de acesso às variáveis de ambiente.
 *
 * O token da TMDB NÃO aparece aqui de propósito: ele vive apenas no proxy
 * (Vite em dev, nginx em produção), que injeta o Authorization no servidor.
 * O bundle do navegador nunca conhece o segredo.
 */

export const env = {
  tmdb: {
    apiBaseUrl: import.meta.env.VITE_TMDB_API_BASE_URL ?? '/api/tmdb',
    imageBaseUrl: import.meta.env.VITE_TMDB_IMAGE_BASE_URL ?? 'https://image.tmdb.org/t/p',
  },
} as const;
