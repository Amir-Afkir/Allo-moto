import Link from "next/link";
import type { ReactNode } from "react";
import { OpsHeaderChrome } from "@/app/_features/ops/components/OpsHeaderChrome";
import { getOpsActionSummary } from "@/app/_features/ops/data/ops-store";

type OpsShellProps = {
  current: "reservations" | "fleet";
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
};

export async function OpsShell({
  current,
  title,
  subtitle,
  children,
  actions,
  meta,
}: OpsShellProps) {
  const summary = await getOpsActionSummary();

  return (
    <>
      <OpsHeaderChrome current={current} demandCount={summary.openReservations} />

      <main className="app-shell space-y-6 pb-12">
        <section className="section-shell pt-0">
          <div className="border-b border-border/60 pb-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Link href="/" className="transition-colors hover:text-foreground">
                    Allo Moto
                  </Link>
                  <span>/</span>
                  <span className="text-foreground">Espace admin</span>
                </div>
                <div className="space-y-1.5">
                  <h1 className="heading-1 text-foreground">{title}</h1>
                  <p className="max-w-3xl text-[0.98rem] leading-7 text-muted-foreground">
                    {subtitle}
                  </p>
                  {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {actions}
              </div>
            </div>
          </div>
        </section>

        {children}
      </main>
    </>
  );
}
