import { defineConfig } from 'vitest/config';
import { loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Uso alias "@" apontando pra src/ pra evitar imports relativos profundos
// (aquele "../../../" que ninguém gosta de ler). Isso mantém os imports
// legíveis mesmo com a árvore de features crescendo.
export default defineConfig(({ mode }) => {
  // Terceiro argumento '' carrega TODAS as variáveis (não só VITE_*).
  // TMDB_ACCESS_TOKEN não tem o prefixo VITE_ de propósito: ela nunca pode
  // ser embutida no bundle — só o proxy (Vite em dev, nginx em prod) a conhece.
  const env = loadEnv(mode, process.cwd(), '');

  // Mesmo papel do location /api/tmdb/ do nginx em produção: injeta o Bearer
  // no servidor e o navegador nunca vê o token.
  const tmdbProxy: Record<string, ProxyOptions> = {
    '/api/tmdb': {
      target: 'https://api.themoviedb.org/3',
      changeOrigin: true,
      rewrite: (proxyPath) => proxyPath.replace(/^\/api\/tmdb/, ''),
      headers: {
        Authorization: `Bearer ${env.TMDB_ACCESS_TOKEN ?? ''}`,
      },
    },
  };

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setupTests.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        // Sem include, o Vitest só reporta arquivos carregados pelos testes —
        // arquivo sem teste nenhum ficava invisível e inflava o percentual.
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'dist/**',
          'src/main.tsx',
          'src/vite-env.d.ts',
          '**/*.test.{ts,tsx}',
          'src/test/**',
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      open: true,
      proxy: tmdbProxy,
    },
    preview: {
      proxy: tmdbProxy,
    },
    build: {
      rollupOptions: {
        output: {
          // Separo as libs grandes em chunks próprios. Como React, MUI e React
          // Query mudam bem menos que o nosso código, isolá-los deixa o cache do
          // navegador reaproveitá-los entre deploys — só o chunk da app muda a
          // cada release. De quebra, mata o aviso de "chunk > 500kB".
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            'query-vendor': ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
