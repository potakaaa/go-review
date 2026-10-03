import { FormFieldsSkeleton, LoadingPage, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading QR designer" className="mx-auto max-w-5xl">
      <Skeleton className="h-11 w-36" />
      <Skeleton className="my-8 h-10 w-80 max-w-full" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <FormFieldsSkeleton fields={5} />
        <Skeleton className="aspect-square w-full rounded-2xl" />
      </div>
    </LoadingPage>
  );
}
