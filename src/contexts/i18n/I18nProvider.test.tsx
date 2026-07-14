import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from './I18nProvider';
import { useI18n } from './useI18n';

function Probe() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="movies-label">{t.nav.movies}</span>
      <button type="button" onClick={() => setLanguage('pt-BR')}>
        pt
      </button>
      <button type="button" onClick={() => setLanguage('en-US')}>
        en
      </button>
    </div>
  );
}

describe('I18nProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', {
      configurable: true,
      value: 'en-US',
    });
  });

  it('starts from localStorage when the user already chose a language', () => {
    localStorage.setItem('movies-catalog:language', 'pt-BR');

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('language')).toHaveTextContent('pt-BR');
    expect(screen.getByTestId('movies-label')).toHaveTextContent('Filmes');
    expect(document.documentElement).toHaveAttribute('lang', 'pt-BR');
  });

  it('updates translations, html lang and localStorage when language changes', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('language')).toHaveTextContent('en-US');

    await user.click(screen.getByRole('button', { name: 'pt' }));

    expect(screen.getByTestId('language')).toHaveTextContent('pt-BR');
    expect(localStorage.getItem('movies-catalog:language')).toBe('pt-BR');
    expect(document.documentElement).toHaveAttribute('lang', 'pt-BR');

    await user.click(screen.getByRole('button', { name: 'en' }));

    expect(screen.getByTestId('language')).toHaveTextContent('en-US');
    expect(localStorage.getItem('movies-catalog:language')).toBe('en-US');
    expect(document.documentElement).toHaveAttribute('lang', 'en-US');
  });
});
