export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading analytics"
      className="space-y-8"
    >
      <div className="space-y-3 border-b border-line pb-8">
        <div className="h-3 w-20 animate-pulse rounded bg-surface" />
        <div className="h-12 w-48 animate-pulse rounded bg-surface" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-surface" />
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-24 animate-pulse bg-surface" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        <div className="h-72 animate-pulse rounded-2xl bg-surface" />
      </div>
    </div>
  );
}
