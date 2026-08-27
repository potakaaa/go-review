export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="h-24 w-full animate-pulse rounded-xl bg-surface" />
      <div className="h-24 w-full animate-pulse rounded-xl bg-surface" />
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-56 w-full animate-pulse rounded-xl bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
