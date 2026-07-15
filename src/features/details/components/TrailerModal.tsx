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
      maxWidth={false}
      PaperProps={{
        className:
          '!m-3 !flex !max-h-[calc(100dvh_-_24px)] !w-fit !max-w-[calc(100vw_-_24px)] !overflow-hidden !rounded-2xl !bg-surface-900 !text-white ring-1 ring-white/10 tablet:!m-6 tablet:!max-h-[calc(100dvh_-_48px)] tablet:!max-w-[calc(100vw_-_48px)]',
      }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-surface-900 px-4 py-3">
        <div className="min-w-0">
          <h2 className="line-clamp-1 text-base font-bold">{t.details.trailer}</h2>
          <p className="line-clamp-1 text-xs opacity-60">{title}</p>
        </div>
        <IconButton onClick={onClose} aria-label={t.common.close} color="inherit">
          <CloseIcon />
        </IconButton>
      </div>

      {open && (
        <div className="grid min-h-0 flex-1 place-items-center bg-black p-0 tablet:p-3">
          <div className="aspect-video h-[min(56.25vw,calc(100dvh_-_118px),664px)] max-h-full max-w-full overflow-hidden bg-black tablet:h-[min(56.25vw,calc(100dvh_-_150px),664px)]">
            <iframe
              src={embedUrl}
              title={trailer.name}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
