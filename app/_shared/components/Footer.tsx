import { Suspense } from "react";
import { getSupportConfig } from "@/app/_features/support/data/support";
import BrandMark from "@/app/_shared/components/BrandMark";
import FooterDiscoverLinks from "./FooterDiscoverLinks";
import FooterPrimaryAction from "./FooterPrimaryAction";

export default async function Footer() {
  const support = await getSupportConfig();
  const supportSummary = support.addressSummary ?? support.placeName ?? null;

  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-[linear-gradient(180deg,rgba(247,241,232,0.98)_0%,rgba(251,247,241,1)_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(179,93,42,0.42),transparent)]"
      />

      <div className="app-shell py-8 sm:py-10 lg:py-12">
        <div className="space-y-6">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="inline-flex items-center gap-3 sm:gap-4">
              <BrandMark size="md" />
              <span className="min-w-0">
                <span className="block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-foreground">
                  Allo Moto
                </span>
                <span className="mt-1 block max-w-md text-sm leading-6 text-muted-foreground">
                  Location de moto premium, parcours court.
                </span>
              </span>
            </div>

            <Suspense
              fallback={<div className="h-11 w-full lg:w-[16rem]" />}
            >
              <FooterPrimaryAction />
            </Suspense>
          </section>

          <section className="border-t border-border/60 pt-6">
            <FooterDiscoverLinks
              supportSummary={supportSummary}
              phoneHref={support.phoneHref}
              whatsappHref={support.whatsappHref}
              mapsHref={support.mapsHref}
            />
          </section>

          <section className="border-t border-border/60 pt-4">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
              <p>© 2026 Allo Moto. Tous droits réservés.</p>
              <p>Catalogue, réservation et support en accès direct.</p>
            </div>
          </section>
        </div>
      </div>
    </footer>
  );
}
