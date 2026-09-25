import {
  FormSkeleton,
  LoadingPage,
  PageHeaderSkeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading form" className="mx-auto max-w-3xl space-y-8">
      <PageHeaderSkeleton bordered={false} />
      <FormSkeleton platform fields={4} />
    </LoadingPage>
  );
}
