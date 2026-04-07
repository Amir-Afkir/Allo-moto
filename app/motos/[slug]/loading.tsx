import { Skeleton } from "@/app/_shared/ui/Skeleton";

export default function Loading() {
  return (
    <main className="app-shell">
      <section className="section-shell pt-0">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Skeleton className="min-h-[32rem] rounded-card" />
          <Skeleton className="min-h-[32rem] rounded-card" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </div>
      </section>
    </main>
  );
}
