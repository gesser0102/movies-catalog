import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Uso alias "@" apontando pra src/ pra evitar imports relativos profundos
// (aquele "../../../" que ninguém gosta de ler). Isso mantém os imports
// legíveis mesmo com a árvore de features crescendo.
export default defineConfig({
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
});
