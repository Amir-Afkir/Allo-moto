"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import BrandMark from "@/app/_shared/components/BrandMark";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";
import {
  getDesktopHeaderNavItems,
  getMobileHeaderNavItems,
  getPrimaryCta,
  getSurfaceLabel,
} from "@/app/_shared/lib/navigation";

export default function HeaderChrome() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const reservationStage = searchParams?.get("stage");
  const mobileNavItems = getMobileHeaderNavItems();
  const desktopNavItems = getDesktopHeaderNavItems();
  const primaryCta = getPrimaryCta();
  const surfaceLabel = getSurfaceLabel(pathname, reservationStage);

  return (
    <div className="app-shell py-2 lg:py-2.5">
      <div className="flex h-10 items-center justify-between gap-3 lg:hidden">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2"
          aria-label="Retour à l’accueil Allo Moto"
        >
          <BrandMark size="md" priority className="h-8 w-8 shrink-0" />
          <span className="hidden truncate text-xs font-semibold tracking-[0.12em] text-foreground/72 uppercase sm:inline">
            Allo Moto
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <ButtonLink
            href={primaryCta.href}
            ariaLabel={primaryCta.ariaLabel}
            variant={primaryCta.variant}
            size="md"
            className="min-h-10 px-4 py-2 text-sm"
          >
            {primaryCta.label}
          </ButtonLink>
        </div>
      </div>

      <nav
        className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 pt-0.5 lg:hidden"
        aria-label="Navigation mobile"
      >
        {mobileNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex min-h-10 items-center whitespace-nowrap rounded-control border border-transparent bg-transparent px-2.5 py-2 text-[0.72rem] font-semibold tracking-[0.08em] text-foreground/72 uppercase transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="hidden lg:grid lg:grid-cols-[minmax(20.5rem,22rem)_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="Retour à l’accueil Allo Moto"
        >
          <BrandMark size="lg" priority className="h-12 w-12" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[0.72rem] font-semibold tracking-[0.14em] text-foreground/56 uppercase">
              Allo Moto
            </span>
            <span className="truncate text-[1.22rem] leading-[1.1] font-semibold tracking-[-0.025em] text-foreground">
              Location moto à Orléans
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
