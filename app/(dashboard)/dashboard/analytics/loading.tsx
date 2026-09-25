import {
  ListSkeleton,
  LoadingPage,
  PageHeaderSkeleton,
  SectionHeadingSkeleton,
  StatsSkeleton,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingPage label="Loading analytics" className="space-y-8 pb-16">
      <PageHeaderSkeleton actions={3} />
      <StatsSkeleton count={4} className="grid grid-cols-2 sm:grid-cols-4" />
      <StatsSkeleton count={3} className="grid grid-cols-3" />
      <section>
        <SectionHeadingSkeleton aside />
        <ListSkeleton rows={6} trailing="h-9 w-10" />
      </section>
    </LoadingPage>
  );
}
