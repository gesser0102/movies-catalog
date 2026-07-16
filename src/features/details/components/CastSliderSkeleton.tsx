const CAST_SKELETON_ITEMS = 8;

function CastSkeletonCard() {
  return (
    <div className="w-[132px] shrink-0 tablet:w-[150px] desktop:w-[160px]">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-800 ring-1 ring-white/10">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-14">
          <div className="h-4 w-3/4 rounded-full bg-white/15" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function CastSliderSkeleton({ title }: { title: string }) {
  return (
    <section
      aria-busy="true"
      aria-label={title}
      className="mx-auto max-w-[1400px] px-4 py-4 tablet:px-6"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="h-8 w-48 animate-pulse rounded-full bg-white/10" />
      </div>

      <div className="flex gap-3 overflow-hidden pb-4 pt-2">
        {Array.from({ length: CAST_SKELETON_ITEMS }, (_, index) => (
          <CastSkeletonCard key={index} />
        ))}
      </div>
    </section>
  );
}
