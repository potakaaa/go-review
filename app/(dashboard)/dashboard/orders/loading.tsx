import { Card } from "@/components/ui";
import {
  LoadingPage,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading orders" className="space-y-8 pb-16">
      <PageHeaderSkeleton className="pb-7" />
      <div className="flex flex-wrap gap-2">
        {/* "All" then the five statuses, at roughly their real widths. */}
        {["w-10", "w-12", "w-20", "w-20", "w-24", "w-20"].map((width, index) => (
          <Skeleton key={index} className={`h-8 rounded-full ${width}`} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <Card key={index} className="p-5">
            <div className="flex justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="mt-5 flex justify-between border-t border-line pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </Card>
        ))}
      </div>
    </LoadingPage>
  );
}
