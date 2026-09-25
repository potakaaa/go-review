import { Card } from "@/components/ui";
import {
  LoadingPage,
  PageHeaderSkeleton,
  QrPanelSkeleton,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading standee" className="mx-auto max-w-4xl space-y-8 pb-16">
      <PageHeaderSkeleton actions={2} />
      <div className="grid gap-6 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <Card key={index} className="p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-line pb-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
            </div>
            <QrPanelSkeleton />
            <div className="mt-5 grid gap-2">
              <div className="flex gap-2">
                <Skeleton className="h-11 flex-1" />
                <Skeleton className="h-11 w-11" />
              </div>
              <Skeleton className="h-11" />
            </div>
          </Card>
        ))}
      </div>
    </LoadingPage>
  );
}
