import Section from "@/app/_shared/components/Section";
import { buildReservationHref } from "@/app/_shared/lib/navigation";
import { formatMoney } from "@/app/_shared/lib/format";
import { Badge } from "@/app/_shared/ui/Badge";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";
import {
  MOTORCYCLE_LICENSE_LABELS,
  MOTORCYCLE_STATUS_META,
  type CatalogMotorcycle,
} from "@/app/_features/catalog/data/motorcycles";
import { MotorcycleVisual } from "./MotorcycleVisual";

export default function MotoSelection({
  motorcycles,
}: {
  motorcycles: readonly CatalogMotorcycle[];
}) {
  const [spotlight, ...secondaryMotorcycles] = motorcycles;

  if (!spotlight) {
    return null;
  }

  return (
    <Section
      id="featured-motos"
      title="Quelques motos à considérer."
      subtitle="Si un modèle vous plaît, vérifiez ensuite le créneau avant d’ouvrir le dossier."
    >
      <div className="space-y-6">
        <FeaturedMotoCard motorcycle={spotlight} />

        <div className="space-y-4">
          <p className="label">Modèles en vue</p>
          <div className="grid gap-5 lg:grid-cols-2">
            {secondaryMotorcycles.map((motorcycle, index) => (
              <SecondaryMotoCard
                key={motorcycle.slug}
                motorcycle={motorcycle}
                index={index}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-start pt-1">
          <ButtonLink
            href="/motos"
            prefetch
            ariaLabel="Voir toutes les motos"
            variant="primary"
            size="lg"
            className="min-h-11 w-full sm:w-auto"
          >
            Voir toutes les motos
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}

function FeaturedMotoCard({ motorcycle }: { motorcycle: CatalogMotorcycle }) {
  return (
    <article className="overflow-hidden rounded-card border border-border/60 bg-surface shadow-[var(--shadow-elevated)]">
      <MotorcycleVisual
        motorcycle={motorcycle}
        className="aspect-[16/11] rounded-none border-0 shadow-none lg:h-[34rem] lg:aspect-auto"
        sizes="(max-width: 1024px) 100vw, 86rem"
      >
        <div className="hidden h-full lg:block">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,14,0.10)_0%,rgba(20,17,14,0.04)_42%,rgba(20,17,14,0.40)_100%)]"
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <div className="flex items-start justify-between gap-4">
              <Badge
                variant="outline"
                size="sm"
                className="border-white/18 bg-white/10 tracking-[0.16em] text-white/90"
              >
                Moto du moment
              </Badge>
              <AvailabilityBadge motorcycle={motorcycle} />
            </div>

            <div className="max-w-[34rem] text-white">
              <h3 className="heading-2 text-balance text-white">
                {motorcycle.brand} {motorcycle.name}
              </h3>

              <div className="mt-6 flex flex-wrap gap-2">
                <Badge
                  variant="neutral"
                  size="sm"
                  className="normal-case border-white/20 bg-white/92 tracking-[0.08em] text-foreground"
                >
                  {formatMoney(
                    motorcycle.priceFrom.amount,
                    motorcycle.priceFrom.currency,
                  )}
                  /jour
                </Badge>
                <Badge
                  variant="outline"
                  size="sm"
                  className="normal-case border-white/18 bg-white/10 tracking-[0.08em] text-white"
                >
                  {formatMoney(
                    motorcycle.deposit.amount,
                    motorcycle.deposit.currency,
                  )}{" "}
                  dépôt
                </Badge>
                <Badge
                  variant="outline"
                  size="sm"
                  className="normal-case border-white/18 bg-white/10 tracking-[0.08em] text-white"
                >
                  {MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]}
                </Badge>
              </div>

              <div className="mt-6">
                <ButtonLink
                  href={`${buildReservationHref(motorcycle.slug, {
                    stage: "selection",
                  })}#reservation-form`}
                  ariaLabel={`Vérifier les dates pour ${motorcycle.brand} ${motorcycle.name}`}
                  variant="accent"
                  size="lg"
                >
                  Vérifier mes dates
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </MotorcycleVisual>

      <div className="space-y-4 p-4 sm:p-5 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label">Moto du moment</p>
            <h3 className="mt-2 text-[1.65rem] leading-[1.02] font-bold tracking-[-0.025em] text-foreground text-balance">
              {motorcycle.brand} {motorcycle.name}
            </h3>
          </div>
          <AvailabilityBadge motorcycle={motorcycle} />
        </div>

        <MotoSpecLine motorcycle={motorcycle} />

        <ButtonLink
          href={`${buildReservationHref(motorcycle.slug, {
            stage: "selection",
          })}#reservation-form`}
          ariaLabel={`Vérifier les dates pour ${motorcycle.brand} ${motorcycle.name}`}
          variant="accent"
          size="lg"
          className="min-h-11 w-full"
        >
          Vérifier mes dates
        </ButtonLink>
      </div>
    </article>
  );
}

function SecondaryMotoCard({
  motorcycle,
  index,
}: {
  motorcycle: CatalogMotorcycle;
  index: number;
}) {
  const baseSlot = String(index + 2).padStart(2, "0");

  return (
    <article className="overflow-hidden rounded-card border border-border/60 bg-surface shadow-[var(--shadow-elevated)]">
      <MotorcycleVisual
        motorcycle={motorcycle}
        className="aspect-[16/11] rounded-none border-0 shadow-none lg:h-[18rem] lg:aspect-auto"
        sizes="(max-width: 1024px) 100vw, 50vw"
      >
        <div className="hidden h-full lg:block">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,14,0.10)_0%,rgba(20,17,14,0.04)_42%,rgba(20,17,14,0.40)_100%)]"
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-6">
            <div className="max-w-[18rem]">
              <p className="meta-label text-white/70">Modèle {baseSlot}</p>
              <h3 className="mt-4 heading-3 text-balance text-white">
                {motorcycle.brand} {motorcycle.name}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="neutral"
                size="sm"
                className="normal-case border-white/20 bg-white/92 tracking-[0.08em] text-foreground"
              >
                {formatMoney(
                  motorcycle.priceFrom.amount,
                  motorcycle.priceFrom.currency,
                )}
                /jour
              </Badge>
              <Badge
                variant="outline"
                size="sm"
                className="normal-case border-white/18 bg-white/10 tracking-[0.08em] text-white"
              >
                {formatMoney(
                  motorcycle.deposit.amount,
                  motorcycle.deposit.currency,
                )}{" "}
                dépôt
              </Badge>
              <Badge
                variant="outline"
                size="sm"
                className="normal-case border-white/18 bg-white/10 tracking-[0.08em] text-white"
              >
                {MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]}
              </Badge>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink
                href={`/motos/${motorcycle.slug}`}
                prefetch
                ariaLabel={`Voir la fiche de ${motorcycle.brand} ${motorcycle.name}`}
                variant="primary"
                size="md"
              >
                Voir la fiche
              </ButtonLink>
              <ButtonLink
                href={`${buildReservationHref(motorcycle.slug, {
                  stage: "selection",
                })}#reservation-form`}
                ariaLabel={`Choisir ${motorcycle.brand} ${motorcycle.name} puis vérifier le créneau`}
                variant="outline"
                size="md"
              >
                Choisir ce modèle
              </ButtonLink>
            </div>
          </div>
        </div>
      </MotorcycleVisual>

      <div className="space-y-4 p-4 sm:p-5 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label">Modèle {baseSlot}</p>
            <h3 className="mt-2 text-[1.35rem] leading-[1.08] font-bold tracking-[-0.02em] text-foreground text-balance">
              {motorcycle.brand} {motorcycle.name}
            </h3>
          </div>
          <AvailabilityBadge motorcycle={motorcycle} />
        </div>

        <MotoSpecLine motorcycle={motorcycle} />

        <div className="grid gap-2 min-[390px]:grid-cols-2">
          <ButtonLink
            href={`/motos/${motorcycle.slug}`}
            prefetch
            ariaLabel={`Voir la fiche de ${motorcycle.brand} ${motorcycle.name}`}
            variant="primary"
            size="md"
            className="min-h-11 px-3 text-sm"
          >
            Voir la fiche
          </ButtonLink>
          <ButtonLink
            href={`${buildReservationHref(motorcycle.slug, {
              stage: "selection",
            })}#reservation-form`}
            ariaLabel={`Choisir ${motorcycle.brand} ${motorcycle.name} puis vérifier le créneau`}
            variant="outline"
            size="md"
            className="min-h-11 px-3 text-sm"
          >
            Choisir ce modèle
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

function AvailabilityBadge({
  motorcycle,
}: {
  motorcycle: CatalogMotorcycle;
}) {
  return (
    <Badge
      variant={MOTORCYCLE_STATUS_META[motorcycle.status].tone}
      size="sm"
      className="shrink-0 normal-case border-border/70 bg-surface/92 tracking-[0.04em] text-foreground shadow-[0_8px_18px_rgba(35,24,17,0.08)]"
    >
      {motorcycle.availabilityCopy}
    </Badge>
  );
}

function MotoSpecLine({ motorcycle }: { motorcycle: CatalogMotorcycle }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 font-semibold text-foreground/82">
      <span>
        {formatMoney(motorcycle.priceFrom.amount, motorcycle.priceFrom.currency)}
        /jour
      </span>
      <span aria-hidden className="text-muted-foreground/45">
        ·
      </span>
      <span>
        {formatMoney(motorcycle.deposit.amount, motorcycle.deposit.currency)}{" "}
        dépôt
      </span>
      <span aria-hidden className="text-muted-foreground/45">
        ·
      </span>
      <span>{MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]}</span>
    </p>
  );
}
