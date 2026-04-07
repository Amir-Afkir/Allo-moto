import { Skeleton } from "@/app/_shared/ui/Skeleton";

export default function Loading() {
  return (
    <main className="app-shell space-y-5">
      <section className="space-y-3 pb-4 sm:pb-5">
        <Skeleton className="h-16 w-full max-w-[42rem] rounded-2xl" />
        <Skeleton className="h-6 w-full max-w-[20rem] rounded-full" />
      </section>

      <div className="sticky chrome-offset z-20 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-14 w-40 rounded-pill" />
          <Skeleton className="h-14 w-36 rounded-pill" />
          <Skeleton className="h-14 w-36 rounded-pill" />
          <Skeleton className="h-14 w-36 rounded-pill" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-14 w-40 rounded-pill" />
          <Skeleton className="h-14 w-40 rounded-pill" />
          <Skeleton className="h-14 w-32 rounded-pill" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </div>
        <Skeleton className="hidden min-h-[34rem] rounded-card xl:block" />
      </div>
    </main>
  );
}
