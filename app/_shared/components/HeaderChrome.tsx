"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import BrandMark from "@/app/_shared/components/BrandMark";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";
import {
  getDesktopHeaderNavItems,
  getHeaderNavItems,
  getPrimaryCta,
  getSurfaceLabel,
} from "@/app/_shared/lib/navigation";

export default function HeaderChrome() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const reservationStage = searchParams?.get("stage");
  const mobileNavItems = getHeaderNavItems();
  const desktopNavItems = getDesktopHeaderNavItems();
  const primaryCta = getPrimaryCta();
  const surfaceLabel = getSurfaceLabel(pathname, reservationStage);

  return (
    <div className="app-shell py-4 lg:py-2.5">
      <div className="flex h-12 items-center justify-between gap-4 lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-4"
          aria-label="Aller à l’accueil"
        >
          <BrandMark size="md" priority />
          <span className="hidden text-sm font-semibold tracking-[0.16em] text-foreground/80 uppercase sm:inline">
            Allo Moto
          </span>
        </Link>

        <div className="flex items-center gap-2 lg:hidden">
          <ButtonLink
            href={primaryCta.href}
            ariaLabel={primaryCta.ariaLabel}
            variant={primaryCta.variant}
            size="md"
          >
            {primaryCta.label}
          </ButtonLink>
        </div>
      </div>

      <nav
        className="flex gap-2 overflow-x-auto pb-1 lg:hidden"
        aria-label="Navigation mobile"
      >
        {mobileNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-control border border-border/60 bg-surface/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/72"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="hidden lg:grid lg:grid-cols-[minmax(20.5rem,22rem)_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="Aller à l’accueil"
        >
          <BrandMark size="lg" priority className="h-12 w-12" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[0.72rem] font-semibold tracking-[0.14em] text-foreground/56 uppercase">
              Allo Moto
            </span>
            <span className="truncate text-[1.22rem] leading-[1.1] font-semibold tracking-[-0.025em] text-foreground">
              Location de moto premium
            </span>
          </span>
        </Link>

        <div className="flex min-w-0 justify-center">
          <div className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-pill border border-border/60 bg-[color-mix(in_srgb,var(--surface)_88%,white_12%)] p-1 shadow-[0_14px_30px_rgba(35,24,17,0.07)]">
            <nav
              className="flex min-w-0 items-center gap-1 px-1"
              aria-label="Navigation principale"
            >
              {desktopNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-pill px-3.5 py-2.5 text-[0.97rem] font-medium text-foreground/74 transition-colors hover:bg-surface hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <ButtonLink
              href={primaryCta.href}
              ariaLabel={primaryCta.ariaLabel}
              variant={primaryCta.variant}
              size="md"
              className="shrink-0 px-6 py-2.5 text-[0.98rem]"
            >
              {primaryCta.label}
            </ButtonLink>
          </div>
        </div>

        <div className="justify-self-end">
          <span className="inline-flex items-center rounded-pill border border-border/70 bg-surface/76 px-4 py-2 text-[0.68rem] font-semibold tracking-[0.16em] text-foreground/54 uppercase shadow-[0_6px_14px_rgba(35,24,17,0.035)]">
            {surfaceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
