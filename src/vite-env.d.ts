/// <reference types="vite/client" />

// Tipagem das variáveis de ambiente que a app espera. Deixar isso explícito
// faz o TS reclamar se alguém tentar ler uma env que não existe, e dá
// autocomplete no import.meta.env.
interface ImportMetaEnv {
  readonly VITE_TMDB_ACCESS_TOKEN: string;
  readonly VITE_TMDB_API_BASE_URL: string;
  readonly VITE_TMDB_IMAGE_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
