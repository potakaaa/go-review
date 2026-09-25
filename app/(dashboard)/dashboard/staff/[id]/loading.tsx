import {
  FieldSkeleton,
  LoadingPage,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading staff account" className="mx-auto max-w-4xl space-y-8 pb-16">
      <Skeleton className="h-11 w-36" />
      <PageHeaderSkeleton actions={1} />
      <div className="space-y-7">
        {/* Account active toggle, role, section permissions, route access. */}
        <Skeleton className="h-16 w-full rounded-xl" />
        <FieldSkeleton />
        <div className="space-y-4">
          <Skeleton className="h-3 w-36" />
          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Skeleton key={index} className="h-14 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <Skeleton className="h-11 w-full" />
      </div>
    </LoadingPage>
  );
}
