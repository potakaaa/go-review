import {
  LoadingPage,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading standees" className="space-y-8 pb-16">
      <PageHeaderSkeleton actions={2} />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-3 w-4/5" />
          </div>
        ))}
      </div>
    </LoadingPage>
  );
}
