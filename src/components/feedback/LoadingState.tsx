import CircularProgress from '@mui/material/CircularProgress';
import { useI18n } from '@/contexts/i18n/useI18n';

/**
 * spinner global
 */
export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16"
      role="status"
      aria-live="polite"
    >
      <CircularProgress color="primary" />
      <span className="text-sm opacity-70">{label ?? t.common.loading}</span>
    </div>
  );
}
