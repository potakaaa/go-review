import { Card } from "@/components/ui";
import {
  LoadingPage,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/skeleton";

/** One converter card: eyebrow, a link field with its button, a hint line. */
function ConverterSkeleton() {
  return (
    <Card className="space-y-4 p-5 sm:p-7">
      <Skeleton className="h-3 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-11 w-full sm:w-28" />
        </div>
        <Skeleton className="h-3 w-3/4" />
      </div>
    </Card>
  );
}

export default function Loading() {
  return (
    <LoadingPage label="Loading converter" className="mx-auto max-w-3xl space-y-8">
      <PageHeaderSkeleton bordered={false} />
      <ConverterSkeleton />
      <ConverterSkeleton />
    </LoadingPage>
  );
}
