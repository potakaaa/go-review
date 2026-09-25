import {
  FormSkeleton,
  LoadingPage,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading route" className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-48 sm:h-12" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-11 w-full sm:w-44" />
      </div>
      <FormSkeleton platform fields={3} />
      {/* The collapsed "QR code & link" disclosure. */}
      <Skeleton className="h-14 w-full rounded-xl" />
    </LoadingPage>
  );
}
