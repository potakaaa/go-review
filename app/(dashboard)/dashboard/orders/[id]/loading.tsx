import { Card } from "@/components/ui";
import {
  FieldSkeleton,
  LoadingPage,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading order" className="mx-auto max-w-4xl space-y-7 pb-16">
      <div className="space-y-3 border-b border-line pb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4 p-5">
          <Skeleton className="h-3 w-16" />
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </Card>
        <Card className="space-y-4 p-5">
          <Skeleton className="h-3 w-16" />
          {[0, 1].map((index) => (
            <div key={index} className="flex justify-between gap-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
          <div className="flex flex-col items-end gap-2 border-t border-line pt-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-48" />
          </div>
        </Card>
      </div>
      <Card className="flex items-center justify-between p-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-12" />
      </Card>
      <div className="space-y-5 rounded-xl border border-line bg-surface p-5">
        <FieldSkeleton />
        <FieldSkeleton tall />
        <Skeleton className="h-11 w-full" />
      </div>
    </LoadingPage>
  );
}
