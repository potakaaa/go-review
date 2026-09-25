import {
  FormFieldsSkeleton,
  LoadingPage,
  Skeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading form" className="mx-auto max-w-2xl">
      <Skeleton className="h-11 w-36" />
      <Skeleton className="my-8 h-10 w-72 max-w-full" />
      <FormFieldsSkeleton fields={5} />
    </LoadingPage>
  );
}
