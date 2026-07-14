/**
 * Ponto único de acesso às variáveis de ambiente.
 * Centralizar aqui evita `import.meta.env.VITE_...` espalhado pelo código, o que
 * dificultaria trocar a fonte de config depois.
 */

function readRequired(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (!value) {
    console.warn(
      `[env] Variável ausente: ${key}. ` +
        `Copie ".env.example" para ".env.local" e preencha o valor, ` +
        `senão as requisições à TMDB vão retornar 401.`,
    );
    return '';
  }
  return value;
}

export const env = {
  tmdb: {
    accessToken: readRequired('VITE_TMDB_ACCESS_TOKEN'),
    apiBaseUrl: import.meta.env.VITE_TMDB_API_BASE_URL ?? 'https://api.themoviedb.org/3',
    imageBaseUrl: import.meta.env.VITE_TMDB_IMAGE_BASE_URL ?? 'https://image.tmdb.org/t/p',
  },
} as const;
