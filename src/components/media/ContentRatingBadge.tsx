interface ContentRatingBadgeProps {
  rating: string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

const AGE_COLORS: Record<string, { background: string; color: string; border: string }> = {
  L: { background: '#00a651', color: '#ffffff', border: '#00c765' },
  AL: { background: '#00a651', color: '#ffffff', border: '#00c765' },
  LIVRE: { background: '#00a651', color: '#ffffff', border: '#00c765' },
  G: { background: '#00a651', color: '#ffffff', border: '#00c765' },
  'TV-G': { background: '#00a651', color: '#ffffff', border: '#00c765' },
  'TV-Y': { background: '#00a651', color: '#ffffff', border: '#00c765' },
  '10': { background: '#0095d9', color: '#ffffff', border: '#18b7ff' },
  PG: { background: '#0095d9', color: '#ffffff', border: '#18b7ff' },
  'TV-PG': { background: '#0095d9', color: '#ffffff', border: '#18b7ff' },
  'TV-Y7': { background: '#0095d9', color: '#ffffff', border: '#18b7ff' },
  '12': { background: '#f6c400', color: '#111827', border: '#ffe45c' },
  'PG-13': { background: '#f6c400', color: '#111827', border: '#ffe45c' },
  '14': { background: '#f58220', color: '#111827', border: '#ffad5f' },
  'TV-14': { background: '#f58220', color: '#111827', border: '#ffad5f' },
  '16': { background: '#ed1c24', color: '#ffffff', border: '#ff5b61' },
  R: { background: '#ed1c24', color: '#ffffff', border: '#ff5b61' },
  '18': { background: '#111111', color: '#ffffff', border: '#555555' },
  'NC-17': { background: '#111111', color: '#ffffff', border: '#555555' },
  'TV-MA': { background: '#111111', color: '#ffffff', border: '#555555' },
};

function normalizeRating(rating: string): string {
  return rating.trim().toUpperCase();
}

export function ContentRatingBadge({
  rating,
  size = 'sm',
  className = '',
}: ContentRatingBadgeProps) {
  const normalized = rating ? normalizeRating(rating) : '';
  if (!normalized) return null;

  const colors = AGE_COLORS[normalized] ?? {
    background: '#334155',
    color: '#ffffff',
    border: '#64748b',
  };
  const sizeClass =
    size === 'md'
      ? 'h-8 min-w-8 px-2.5 text-sm'
      : 'h-6 min-w-6 px-2 text-[11px]';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md border font-black leading-none shadow-sm ${sizeClass} ${className}`}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
        color: colors.color,
      }}
      aria-label={`Content rating ${normalized}`}
      title={`Content rating ${normalized}`}
    >
      {normalized}
    </span>
  );
}
