import {
  CalloutSkeleton,
  ListSkeleton,
  LoadingPage,
  PageHeaderSkeleton,
  SectionHeadingSkeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading print run" className="space-y-8 pb-16">
      <PageHeaderSkeleton actions={2} />
      <CalloutSkeleton />
      <section>
        <SectionHeadingSkeleton />
        <ListSkeleton rows={5} trailing="h-9 w-24" />
      </section>
    </LoadingPage>
  );
}
