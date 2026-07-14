function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
}

export function DetailsPageSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse bg-surface-850" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-950" />

        <div className="relative mx-auto max-w-[1400px] px-4 py-6 tablet:px-6">
          <SkeletonBlock className="mb-6 h-9 w-24 rounded-full" />

          <div className="flex flex-col gap-6 tablet:flex-row">
            <div className="mx-auto w-[220px] shrink-0 tablet:mx-0 tablet:w-[280px]">
              <SkeletonBlock className="aspect-[2/3] w-full rounded-xl" />
            </div>

            <div className="flex-1 pt-2">
              <SkeletonBlock className="h-10 w-3/4 max-w-[560px]" />
              <SkeletonBlock className="mt-3 h-5 w-1/2 max-w-[360px]" />

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <SkeletonBlock className="h-12 w-12 rounded-full" />
                <SkeletonBlock className="h-9 w-24 rounded-full" />
                <SkeletonBlock className="h-9 w-32 rounded-full" />
                <SkeletonBlock className="h-9 w-28 rounded-full" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <SkeletonBlock className="h-7 w-20 rounded-full" />
                <SkeletonBlock className="h-7 w-24 rounded-full" />
                <SkeletonBlock className="h-7 w-16 rounded-full" />
              </div>

              <SkeletonBlock className="mt-8 h-6 w-28" />
              <div className="mt-3 max-w-3xl space-y-2">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-11/12" />
                <SkeletonBlock className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
