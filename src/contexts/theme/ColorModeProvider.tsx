import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ColorModeContext, type ColorModeContextValue } from './ColorModeContext';
import { createAppTheme, type ColorMode } from '@/theme/createAppTheme';

const STORAGE_KEY = 'movies-catalog:color-mode';

/**
 * Modo inicial: respeita a escolha salva; senão, segue a preferência do sistema
 * operacional (prefers-color-scheme). Um app de streaming que abre no escuro
 * quando o SO está no escuro simplesmente "sente" mais certo.
 */
function detectInitialMode(): ColorMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Provider único de tema. Ele é a fonte de verdade do modo e sincroniza os DOIS
 * sistemas de estilo:
 *   - MUI, recriando o theme via createAppTheme(mode);
 *   - Tailwind, colocando/removendo a classe "dark" no <html> (darkMode: 'class').
 *
 * `StyledEngineProvider injectFirst` é o detalhe que faz MUI + Tailwind
 * conviverem: ele injeta o CSS do MUI ANTES do Tailwind, então as utilities do
 * Tailwind conseguem sobrescrever estilos do MUI quando a gente quiser.
 */
export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(detectInitialMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    // A classe "dark" no root é o que liga o dark mode do Tailwind.
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  const setMode = useCallback((next: ColorMode) => setModeState(next), []);
  const toggleColorMode = useCallback(
    () => setModeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [],
  );

  const contextValue = useMemo<ColorModeContextValue>(
    () => ({ mode, toggleColorMode, setMode }),
    [mode, toggleColorMode, setMode],
  );

  // Recria o tema só quando o modo muda — createTheme não é de graça.
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={contextValue}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          {/* CssBaseline é quem faz o reset global (lembrando: desligamos o
              preflight do Tailwind pra não haver reset duplicado). */}
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </ColorModeContext.Provider>
  );
}
