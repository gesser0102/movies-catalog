import { useContext } from 'react';
import { ColorModeContext, type ColorModeContextValue } from './ColorModeContext';

export function useColorMode(): ColorModeContextValue {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error('useColorMode precisa ser usado dentro de <ColorModeProvider>.');
  }
  return ctx;
}
