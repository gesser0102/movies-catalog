import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useI18n } from '@/contexts/i18n/useI18n';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Estado de erro reutilizável. padrao em todo o APP
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <ErrorOutlineIcon className="text-brand" style={{ fontSize: 48 }} />
      <h2 className="text-lg font-semibold">{t.common.errorTitle}</h2>
      <p className="max-w-sm text-sm opacity-70">
        {message ?? t.common.errorDescription}
      </p>
      {onRetry && (
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          className="mt-2"
        >
          {t.common.retry}
        </Button>
      )}
    </div>
  );
}
