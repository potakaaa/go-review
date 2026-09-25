import { Card } from "@/components/ui";
import {
  FormFieldsSkeleton,
  LoadingPage,
  PageHeaderSkeleton,
  SectionHeadingSkeleton,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading staff" className="mx-auto max-w-5xl space-y-10 pb-16">
      <PageHeaderSkeleton actions={1} />
      <Card className="p-5 sm:p-7">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="mt-6">
          <FormFieldsSkeleton fields={3} />
        </div>
      </Card>
      <section>
        <SectionHeadingSkeleton aside />
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Card key={index} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-56 max-w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-11 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </LoadingPage>
  );
}
