import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useI18n } from '@/contexts/i18n/useI18n';
import type { TmdbVideo } from '@/types/tmdb';

interface TrailerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  trailer: TmdbVideo;
}

export function TrailerModal({ open, onClose, title, trailer }: TrailerModalProps) {
  const { t } = useI18n();
  const embedUrl = `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        className:
          '!overflow-hidden !rounded-2xl !bg-surface-900 !text-white ring-1 ring-white/10',
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-surface-900 px-4 py-3">
        <div className="min-w-0">
          <h2 className="line-clamp-1 text-base font-bold">{t.details.trailer}</h2>
          <p className="line-clamp-1 text-xs opacity-60">{title}</p>
        </div>
        <IconButton onClick={onClose} aria-label={t.common.close} color="inherit">
          <CloseIcon />
        </IconButton>
      </div>

      {open && (
        <div className="aspect-video bg-black">
          <iframe
            src={embedUrl}
            title={trailer.name}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}
    </Dialog>
  );
}
