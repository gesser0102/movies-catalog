import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';
import { createDedupingCacheAdapter } from './httpCache';

/**
 * Erro de domínio da nossa camada de API.
 *
 * Traduzimos os erros crus do axios (que carregam muito detalhe de rede) para
 * um tipo próprio e previsível. A UI só precisa saber: deu erro, qual o status
 * e uma mensagem apresentável. O React Query recebe esse erro e os componentes
 * de feedback sabem lidar com ele.
 */
export class TmdbApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isNetworkError = false,
  ) {
    super(message);
    this.name = 'TmdbApiError';
  }
}

/**
 * Client TMDB sem bearrer pois que injeta e o proxy.
 * de modo que evite a exposicao de token nas requests
 */
export const tmdbClient = axios.create({
  baseURL: env.tmdb.apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
  timeout: 12_000,
  // Dedupe/micro-cache por URL: queries diferentes do React Query que precisam
  // da mesma URL da TMDB compartilham um único download.
  adapter: createDedupingCacheAdapter(axios.getAdapter(axios.defaults.adapter)),
});


 //Interceptor de resposta: converte qualquer falha num TmdbApiError.
tmdbClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ status_message?: string }>) => {
    if (!error.response) {
      return Promise.reject(
        new TmdbApiError(
          'Não foi possível conectar à TMDB. Verifique sua conexão.',
          undefined,
          true,
        ),
      );
    }

    const status = error.response.status;
    const apiMessage = error.response.data?.status_message;
    const fallback =
      status === 401
        ? 'Credencial da TMDB inválida. Confira o token no .env.local.'
        : status === 404
          ? 'Conteúdo não encontrado.'
          : 'Algo deu errado ao falar com a TMDB.';

    return Promise.reject(new TmdbApiError(apiMessage ?? fallback, status));
  },
);
