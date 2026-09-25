import {
  LoadingPage,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading shop stories" className="mx-auto max-w-3xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div className="space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-11 w-28" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </LoadingPage>
  );
}
