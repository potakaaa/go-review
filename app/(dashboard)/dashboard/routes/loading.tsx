import { Card } from "@/components/ui";
import {
  CardGridSkeleton,
  LoadingPage,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading routes" className="space-y-8 pb-16">
      <PageHeaderSkeleton actions={3} />
      {/* The "Find a route" card: search, three filters, and the count. */}
      <Card className="p-3 sm:p-5">
        <Skeleton className="mb-3 h-3 w-24 sm:mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Skeleton className="h-11 sm:w-40" />
            <Skeleton className="h-11 sm:w-40" />
            <Skeleton className="h-11 sm:w-40" />
            <Skeleton className="col-span-2 ml-auto h-3 w-16 self-center" />
          </div>
        </div>
      </Card>
      <CardGridSkeleton count={6} />
    </LoadingPage>
  );
}
