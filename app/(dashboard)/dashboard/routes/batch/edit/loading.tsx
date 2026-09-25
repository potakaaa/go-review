import { Card } from "@/components/ui";
import {
  FieldSkeleton,
  LoadingPage,
  PageHeaderSkeleton,
  PlatformSelectorSkeleton,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading routes" className="mx-auto max-w-4xl space-y-8 pb-16">
      <PageHeaderSkeleton actions={1} className="pb-6" />
      <Card className="space-y-7 p-5 sm:p-7">
        <PlatformSelectorSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        {/* "Routes to update": the selectable list of cards. */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            <div className="space-y-2 px-4 py-4 sm:px-5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <Skeleton className="mt-0.5 size-5 shrink-0 rounded" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-11 w-full" />
      </Card>
    </LoadingPage>
  );
}
