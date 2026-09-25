import { Card } from "@/components/ui";
import {
  LoadingPage,
  PageHeaderSkeleton,
  SectionHeadingSkeleton,
  Skeleton,
  StatsSkeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading dashboard" className="space-y-10">
      <PageHeaderSkeleton actions={3} />
      <Card className="flex min-h-16 items-center justify-between px-5 py-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </Card>
      <StatsSkeleton count={3} className="grid sm:grid-cols-3" />
      <Card className="flex min-h-11 items-center justify-between gap-4 px-5 py-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-40" />
      </Card>
      <section>
        <SectionHeadingSkeleton aside />
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Card key={index} className="space-y-3 p-3 sm:p-5">
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      </section>
    </LoadingPage>
  );
}
