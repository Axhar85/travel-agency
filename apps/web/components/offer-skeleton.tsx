export function OfferSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-4 w-2/3 rounded bg-zinc-200" />
      <div className="h-3 w-1/2 rounded bg-zinc-200" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-6 w-20 rounded bg-zinc-200" />
        <div className="h-9 w-24 rounded-full bg-zinc-200" />
      </div>
    </div>
  );
}
