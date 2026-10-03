import { LoadingPage, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading QR codes" className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div className="space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-11 w-32" />
      </div>
      <Skeleton className="mb-6 h-11 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-2xl border border-line bg-surface p-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="mt-4 h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-56 max-w-full" />
          </div>
        ))}
      </div>
    </LoadingPage>
  );
}
