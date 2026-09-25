import { Card } from "@/components/ui";
import {
  DetailRowsSkeleton,
  LoadingPage,
  QrPanelSkeleton,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading route" className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-64 max-w-full sm:h-10" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
      </div>
      <Card className="p-5 sm:p-8">
        <QrPanelSkeleton />
      </Card>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-11" />
        </div>
        <Skeleton className="h-11" />
      </div>
      <DetailRowsSkeleton rows={4} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
    </LoadingPage>
  );
}
