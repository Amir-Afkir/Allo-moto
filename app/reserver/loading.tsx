import { Skeleton } from "@/app/_shared/ui/Skeleton";

export default function Loading() {
  return (
    <main className="app-shell">
      <section className="section-shell pt-0">
        <Skeleton className="h-5 w-44" />
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="section-band panel-space">
            <div className="space-y-5">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-12 w-[88%]" />
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-16 rounded-card" />
                <Skeleton className="h-16 rounded-card" />
                <Skeleton className="h-16 rounded-card" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Skeleton className="h-12 rounded-card" />
                <Skeleton className="h-12 rounded-card" />
              </div>
              <Skeleton className="h-20 rounded-card" />
              <Skeleton className="h-11 w-52 rounded-full" />
            </div>
          </div>

          <div className="space-y-5">
            <div className="overlay-sheet panel-space">
              <div className="space-y-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-40 rounded-card" />
                <div className="grid gap-3">
                  <Skeleton className="h-12 rounded-control" />
                  <Skeleton className="h-12 rounded-control" />
                  <Skeleton className="h-12 rounded-control" />
                </div>
              </div>
            </div>

            <Skeleton className="h-36 rounded-card" />
          </div>
        </div>
      </section>
    </main>
  );
}
