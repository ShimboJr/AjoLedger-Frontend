/**
 * Reusable loading skeleton components.
 */

/** Single animated rectangle skeleton block */
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
  );
}

/** Skeleton card that mimics a circle summary card */
export function CircleCardSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-28" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/** Skeleton for circle detail header */
export function CircleDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="card space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="card space-y-3">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
