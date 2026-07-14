import { createTheme, type Theme } from '@mui/material/styles';

export type ColorMode = 'light' | 'dark';

/**
 * Fábrica do tema do MUI.
 *
 * O tema é recriado quando o modo muda. As cores de destaque ficam alinhadas com do Tailwind
 */
export function createAppTheme(mode: ColorMode): Theme {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#12b8ff',
        light: '#5bd1ff',
        dark: '#0089cc',
        contrastText: '#04121f',
      },
      secondary: {
        main: '#8b5cff',
        light: '#a982ff',
        dark: '#6b3ce0',
      },
      background: {
        default: isDark ? '#070b16' : '#eef1f8',
        paper: isDark ? '#0c1120' : '#ffffff',
      },
      text: isDark
        ? { primary: '#eaf2ff', secondary: 'rgba(234,242,255,0.65)' }
        : { primary: '#0c1120', secondary: 'rgba(12,17,32,0.6)' },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily:
        '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 18 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500 },
        },
      },
    },
  });
}
