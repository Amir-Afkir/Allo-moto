import Link from "next/link";
import { logoutAdminAction } from "@/app/_features/ops/actions/ops-actions";
import BrandMark from "@/app/_shared/components/BrandMark";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";
import { cn } from "@/app/_shared/lib/cn";

const OPS_NAV_ITEMS = [
  { href: "/ops/fleet", label: "Flotte", key: "fleet" },
  { href: "/ops/reservations", label: "Demandes", key: "reservations" },
] as const;

type OpsHeaderChromeProps = {
  current: "fleet" | "reservations";
  demandCount: number;
};

export function OpsHeaderChrome({
  current,
  demandCount,
}: OpsHeaderChromeProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-[9999] border-b border-border/60 bg-[color-mix(in_srgb,var(--background)_90%,white_10%)] shadow-[0_10px_28px_rgba(35,24,17,0.05)] backdrop-blur-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(179,93,42,0.32),transparent)]"
      />

      <div className="app-shell py-4 lg:py-2.5">
        <div className="flex h-12 items-center justify-between gap-4 lg:hidden">
          <Link
            href="/ops/fleet"
            className="flex items-center gap-4"
            aria-label="Aller a l'espace admin"
          >
            <BrandMark size="md" priority />
            <span className="hidden text-sm font-semibold tracking-[0.16em] text-foreground/80 uppercase sm:inline">
              Allo Moto
            </span>
          </Link>

          <ButtonLink
            href="/motos"
            ariaLabel="Voir le site public"
            variant="accent"
            size="md"
          >
            Voir le site
          </ButtonLink>
        </div>

        <nav
          className="flex gap-2 overflow-x-auto pb-1 lg:hidden"
          aria-label="Navigation admin mobile"
        >
          {OPS_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex whitespace-nowrap rounded-control border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
                item.key === current
                  ? "border-brand/20 bg-brand-soft text-brand-strong"
                  : "border-border/60 bg-surface/70 text-foreground/72",
              )}
            >
              <span>{item.label}</span>
              {item.key === "reservations" && demandCount > 0 ? (
                <span className="ml-2 text-[0.72rem] text-brand-strong">
                  {demandCount}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:grid lg:grid-cols-[minmax(20.5rem,22rem)_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
          <Link
            href="/ops/fleet"
            className="flex min-w-0 items-center gap-3"
            aria-label="Aller a l'espace admin"
          >
            <BrandMark size="lg" priority className="h-12 w-12" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[0.72rem] font-semibold tracking-[0.14em] text-foreground/56 uppercase">
                Allo Moto
              </span>
              <span className="truncate text-[1.22rem] leading-[1.1] font-semibold tracking-[-0.025em] text-foreground">
                Gestion flotte et demandes
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 justify-center">
            <div className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-pill border border-border/60 bg-[color-mix(in_srgb,var(--surface)_88%,white_12%)] p-1 shadow-[0_14px_30px_rgba(35,24,17,0.07)]">
              <nav
                className="flex min-w-0 items-center gap-1 px-1"
                aria-label="Navigation admin principale"
              >
                {OPS_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-pill px-3.5 py-2.5 text-[0.97rem] font-medium transition-colors",
                      item.key === current
                        ? "bg-surface text-foreground"
                        : "text-foreground/74 hover:bg-surface hover:text-foreground",
                    )}
                  >
                    <span>{item.label}</span>
                    {item.key === "reservations" && demandCount > 0 ? (
                      <span className="ml-2 rounded-pill bg-brand-soft px-2 py-0.5 text-[0.78rem] font-semibold text-brand-strong">
                        {demandCount}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </nav>

              <ButtonLink
                href="/motos"
                ariaLabel="Voir le site public"
                variant="accent"
                size="md"
                className="shrink-0 px-6 py-2.5 text-[0.98rem]"
              >
                Voir le site
              </ButtonLink>
            </div>
          </div>

          <div className="justify-self-end">
            <form action={logoutAdminAction}>
              <button
                type="submit"
                className="inline-flex items-center rounded-pill border border-border/70 bg-surface/76 px-4 py-2 text-[0.68rem] font-semibold tracking-[0.16em] text-foreground/54 uppercase shadow-[0_6px_14px_rgba(35,24,17,0.035)] transition-colors hover:bg-surface hover:text-foreground"
              >
                Deconnexion
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
