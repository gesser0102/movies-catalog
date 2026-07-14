import { createContext } from 'react';
import type { ColorMode } from '@/theme/createAppTheme';

export interface ColorModeContextValue {
  mode: ColorMode;
  toggleColorMode: () => void;
  setMode: (mode: ColorMode) => void;
}

/**
 * Contexto do modo de cor, separado do provider pelo mesmo motivo do i18n:
 * manter o Fast Refresh saudável (arquivo sem componente exporta só o contexto).
 */
export const ColorModeContext = createContext<ColorModeContextValue | undefined>(
  undefined,
);
