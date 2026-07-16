/// <reference types="vite/client" />

// Tipagem das variáveis de ambiente que a app espera.
interface ImportMetaEnv {
  readonly VITE_TMDB_API_BASE_URL: string;
  readonly VITE_TMDB_IMAGE_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
