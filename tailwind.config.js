/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  // darkMode via classe: o ThemeContext coloca/remove a classe "dark" no <html>.
  // Assim Tailwind e MUI compartilham a mesma fonte de verdade sobre o tema.
  darkMode: 'class',

  // Desligo o preflight do Tailwind de propósito: quem faz o CSS reset é o
  // <CssBaseline /> do MUI. Ter os dois resets ligados gera conflito de
  // estilos base (margens, box-sizing, etc). Aqui o MUI manda no reset e o
  // Tailwind entra só com as utilities.
  corePlugins: {
    preflight: false,
  },

  theme: {
    extend: {
      colors: {
        // Acento principal: um ciano-azul vibrante (mais saturado que o Prime
        // original) que "brilha" bem sobre os fundos escuros.
        brand: {
          DEFAULT: '#12b8ff',
          light: '#5bd1ff',
          dark: '#0089cc',
        },
        // Acento secundário: violeta. Usado em gradientes (brand -> accent) pra
        // dar aquele visual moderno de streaming em botões e destaques.
        accent: {
          DEFAULT: '#8b5cff',
          light: '#a982ff',
          dark: '#6b3ce0',
        },
        // Superfícies com um leve tom azul-navy em vez de cinza puro — dá
        // profundidade e faz as cores vibrantes saltarem mais.
        surface: {
          950: '#070b16',
          900: '#0c1120',
          850: '#12182b',
          800: '#1a2138',
          700: '#26304c',
        },
      },
      boxShadow: {
        // Sombra "flutuante" pros cards em hover e pro preview.
        card: '0 10px 30px -10px rgba(0, 0, 0, 0.6)',
        glow: '0 0 0 1px rgba(18,184,255,0.5), 0 12px 40px -8px rgba(18,184,255,0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #12b8ff 0%, #8b5cff 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'preview-in': {
          from: { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'preview-in': 'preview-in 0.18s ease-out',
      },
      screens: {
        // Breakpoints explícitos pros 3 alvos pedidos: mobile (default),
        // tablet (md) e desktop (lg+). Deixo nomeado pra ficar auto-documentado.
        tablet: '768px',
        desktop: '1024px',
      },
    },
  },
  plugins: [],
};
