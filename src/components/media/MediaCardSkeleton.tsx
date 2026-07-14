import Skeleton from '@mui/material/Skeleton';

export function MediaCardSkeleton({ variant = 'grid' }: { variant?: 'slider' | 'grid' }) {
  const widthClass = variant === 'slider' ? 'w-[150px] tablet:w-[180px]' : 'w-full';

  return (
    <div className={`shrink-0 ${widthClass}`}>
      <Skeleton
        variant="rounded"
        className="!aspect-[2/3] !h-auto !w-full !transform-none"
      />
    </div>
  );
}
