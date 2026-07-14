import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import { useI18n } from '@/contexts/i18n/useI18n';

/** Página 404 para rotas inexistentes */
export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <p className="text-lg opacity-70">{t.common.emptyDescription}</p>
      <Button component={Link} to="/movies" variant="contained">
        {t.nav.home}
      </Button>
    </div>
  );
}
