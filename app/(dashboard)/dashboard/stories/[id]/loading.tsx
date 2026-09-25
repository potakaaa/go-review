import {
  FormFieldsSkeleton,
  LoadingPage,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading story" className="mx-auto max-w-2xl">
      <Skeleton className="h-11 w-36" />
      <Skeleton className="my-8 h-10 w-72 max-w-full" />
      {/* The collapsed "Preview saved story" disclosure. */}
      <Skeleton className="mb-8 h-16 w-full rounded-xl" />
      <FormFieldsSkeleton fields={5} />
    </LoadingPage>
  );
}
