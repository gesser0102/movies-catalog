import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useI18n } from '@/contexts/i18n/useI18n';

/**
 * Quando um request resultou em 200 mas o payload voltou vazio, para nao confudir
 * o usuário criamos um estado proprio.
 */
export function EmptyState({ description }: { description?: string }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <SearchOffIcon style={{ fontSize: 48 }} className="opacity-50" />
      <h2 className="text-lg font-semibold">{t.common.emptyTitle}</h2>
      <p className="max-w-sm text-sm opacity-70">
        {description ?? t.common.emptyDescription}
      </p>
    </div>
  );
}
