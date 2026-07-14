import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MovieCreationRoundedIcon from '@mui/icons-material/MovieCreationRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import { LANGUAGE_OPTIONS, type Language } from '@/contexts/i18n/translations';
import { useI18n } from '@/contexts/i18n/useI18n';
import { useColorMode } from '@/contexts/theme/useColorMode';
import type { ColorMode } from '@/theme/createAppTheme';

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/movies"
      onClick={onClick}
      className="group flex min-w-0 items-center gap-3"
      aria-label="Movies Catalog"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-surface-950 shadow-[0_10px_28px_-12px_rgba(18,184,255,0.9)] ring-1 ring-white/25 transition-transform group-hover:scale-105 dark:bg-surface-800 dark:bg-none dark:text-brand-light dark:shadow-[0_10px_30px_-18px_rgba(18,184,255,0.65)] dark:ring-brand/25">
        <MovieCreationRoundedIcon fontSize="small" />
      </span>
      <span className="hidden min-w-0 tablet:block">
        <span className="block truncate text-sm font-black leading-tight tracking-wide">
          Movies Catalog
        </span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-current/45 dark:text-white/32">
          TMDB powered
        </span>
      </span>
    </Link>
  );
}

function Navigation({
  items,
  onNavigate,
  mobile = false,
}: {
  items: { to: string; label: string }[];
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  return (
    <nav
      className={
        mobile
          ? 'flex flex-col gap-2'
          : 'hidden items-center rounded-full border border-black/10 bg-black/[0.03] p-1 text-sm font-bold dark:border-white/[0.07] dark:bg-surface-900/85 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_28px_-22px_rgba(0,0,0,0.9)] tablet:flex'
      }
      aria-label="Primary navigation"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            mobile
              ? [
                  'rounded-xl px-4 py-3 text-base font-bold transition',
                  isActive
                    ? 'bg-brand text-surface-950 shadow-[0_10px_24px_-16px_rgba(18,184,255,0.9)] dark:bg-surface-800 dark:text-brand-light dark:ring-1 dark:ring-brand/25'
                    : 'text-current/75 hover:bg-black/5 hover:text-current dark:text-white/62 dark:hover:bg-white/[0.06] dark:hover:text-white',
                ].join(' ')
              : [
                  'rounded-full px-4 py-2 transition',
                  isActive
                    ? 'bg-brand text-surface-950 shadow-[0_10px_24px_-16px_rgba(18,184,255,0.9)] dark:bg-surface-800 dark:text-brand-light dark:ring-1 dark:ring-brand/25'
                    : 'text-current/65 hover:bg-white/60 hover:text-current dark:text-white/62 dark:hover:bg-white/[0.06] dark:hover:text-white',
                ].join(' ')
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function ThemeControl({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useColorMode();
  const { t } = useI18n();

  const options: {
    value: ColorMode;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      value: 'light',
      label: t.settings.switchToLight,
      icon: <LightModeRoundedIcon style={{ fontSize: 16 }} />,
    },
    {
      value: 'dark',
      label: t.settings.switchToDark,
      icon: <DarkModeRoundedIcon style={{ fontSize: 16 }} />,
    },
  ];

  return (
    <div
      className={`grid grid-cols-2 rounded-full border border-black/10 bg-black/[0.04] p-1 dark:border-white/[0.07] dark:bg-surface-900/85 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_28px_-22px_rgba(0,0,0,0.9)] ${
        compact ? 'w-full' : ''
      }`}
      aria-label="Theme"
    >
      {options.map((option) => {
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-label={option.label}
            aria-pressed={active}
            className={[
              'inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-black transition',
              active
                ? 'bg-white text-surface-950 shadow-sm dark:bg-surface-800 dark:text-white dark:ring-1 dark:ring-white/10'
                : 'text-current/55 hover:text-current dark:text-white/45 dark:hover:text-white/85',
            ].join(' ')}
          >
            {option.icon}
            <span className={compact ? 'inline' : 'hidden desktop:inline'}>
              {option.value === 'light' ? 'Light' : 'Dark'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LanguageControl({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className={`flex items-center rounded-full border border-black/10 bg-black/[0.04] p-1 dark:border-white/[0.07] dark:bg-surface-900/85 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_28px_-22px_rgba(0,0,0,0.9)] ${
        compact ? 'w-full' : ''
      }`}
      aria-label={t.settings.language}
    >
      <span className="hidden px-2 text-current/45 dark:text-white/35 desktop:inline-flex">
        <TranslateRoundedIcon style={{ fontSize: 16 }} />
      </span>
      {LANGUAGE_OPTIONS.map((option) => {
        const active = option.value === language;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value as Language)}
            aria-label={option.label}
            aria-pressed={active}
            className={[
              'h-8 rounded-full px-3 text-xs font-black transition',
              compact ? 'flex-1' : '',
              active
                ? 'bg-surface-950 text-white shadow-sm dark:bg-surface-800 dark:text-brand-light dark:ring-1 dark:ring-brand/25'
                : 'text-current/55 hover:text-current dark:text-white/45 dark:hover:text-white/85',
            ].join(' ')}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
}

function HeaderControls({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? 'grid gap-3'
          : 'ml-auto hidden items-center gap-2 tablet:flex'
      }
    >
      <LanguageControl compact={compact} />
      <ThemeControl compact={compact} />
    </div>
  );
}

/**
 * Header fixo com navegação e preferências globais.
 */
export function Header() {
  const { t } = useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { to: '/movies', label: t.nav.movies },
    { to: '/series', label: t.nav.series },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/78 text-surface-950 shadow-[0_18px_40px_-34px_rgba(8,18,34,0.45)] backdrop-blur-xl dark:border-white/[0.06] dark:bg-surface-950 dark:text-white dark:shadow-[0_18px_52px_-34px_rgba(0,0,0,0.95)]">
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-b from-surface-900/98 via-surface-950/96 to-[#050814] dark:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-px bg-white/10 dark:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-px bg-gradient-to-r from-transparent via-brand/28 to-transparent dark:block" />

      <div className="relative mx-auto flex h-[72px] max-w-[1400px] items-center gap-4 px-4 tablet:px-6">
        <IconButton
          className="!-ml-2 tablet:!hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Menu"
          color="inherit"
        >
          <MenuRoundedIcon />
        </IconButton>

        <Brand />
        <div className="hidden h-8 w-px bg-current/10 dark:bg-white/[0.06] tablet:block" />
        <Navigation items={navItems} />
        <HeaderControls />

        <div className="ml-auto flex items-center gap-2 tablet:hidden">
          <LanguageControl />
        </div>
      </div>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          className:
            'w-[300px] !bg-white !text-surface-950 dark:!bg-surface-950 dark:!text-white',
        }}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between">
            <Brand onClick={() => setDrawerOpen(false)} />
            <IconButton
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              color="inherit"
            >
              <CloseIcon />
            </IconButton>
          </div>

          <div className="my-5 h-px bg-current/10" />
          <Navigation
            items={navItems}
            mobile
            onNavigate={() => setDrawerOpen(false)}
          />

          <div className="mt-auto grid gap-3 border-t border-current/10 pt-4">
            <HeaderControls compact />
          </div>
        </div>
      </Drawer>
    </header>
  );
}
