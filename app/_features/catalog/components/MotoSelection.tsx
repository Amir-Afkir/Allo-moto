import Section from "@/app/_shared/components/Section";
import { buildReservationHref } from "@/app/_shared/lib/navigation";
import { formatMoney } from "@/app/_shared/lib/format";
import { Badge } from "@/app/_shared/ui/Badge";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";
import {
  MOTORCYCLE_LICENSE_LABELS,
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
              <SecondaryMotoCard key={motorcycle.slug} motorcycle={motorcycle} index={index} />
            ))}
          </div>
        </div>

        <div className="flex justify-start pt-1">
          <ButtonLink href="/motos" ariaLabel="Voir toutes les motos" variant="primary" size="lg">
            Voir toutes les motos
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}

function FeaturedMotoCard({ motorcycle }: { motorcycle: CatalogMotorcycle }) {
  return (
    <MotorcycleVisual
      motorcycle={motorcycle}
      className="h-[30rem] overflow-hidden rounded-card border border-border/60 bg-surface-elevated shadow-[var(--shadow-elevated)] sm:h-[32rem] lg:h-[34rem]"
      sizes="(max-width: 1024px) 100vw, 86rem"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,14,0.10)_0%,rgba(20,17,14,0.04)_42%,rgba(20,17,14,0.40)_100%)]"
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <Badge variant="outline" size="sm" className="border-white/18 bg-white/10 text-white/90 tracking-[0.16em]">
            Moto du moment
          </Badge>
          <span className="meta-label text-white/60">{motorcycle.availabilityCopy}</span>
        </div>

        <div className="max-w-[34rem] text-white">
          <h3 className="heading-2 text-balance text-white">
            {motorcycle.brand} {motorcycle.name}
          </h3>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="neutral" size="sm" className="normal-case border-white/20 bg-white/92 tracking-[0.08em] text-foreground">
              {formatMoney(motorcycle.priceFrom.amount, motorcycle.priceFrom.currency)}/jour
            </Badge>
            <Badge variant="outline" size="sm" className="normal-case border-white/18 bg-white/10 tracking-[0.08em] text-white">
              {formatMoney(motorcycle.deposit.amount, motorcycle.deposit.currency)} dépôt
            </Badge>
            <Badge variant="outline" size="sm" className="normal-case border-white/18 bg-white/10 tracking-[0.08em] text-white">
              Permis {MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]}
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
    </MotorcycleVisual>
  );
}

function SecondaryMotoCard({ motorcycle, index }: { motorcycle: CatalogMotorcycle; index: number }) {
  const baseSlot = String(index + 2).padStart(2, "0");

  return (
    <div className="overflow-hidden rounded-card border border-border/60 bg-surface-elevated shadow-[var(--shadow-elevated)]">
      <div className="relative min-h-[18rem]">
        <MotorcycleVisual
          motorcycle={motorcycle}
          className="h-[18rem] rounded-none border-0 shadow-none"
          sizes="(max-width: 1024px) 100vw, 50vw"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,14,0.10)_0%,rgba(20,17,14,0.04)_42%,rgba(20,17,14,0.40)_100%)]"
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-6">
            <div className="max-w-[18rem]">
              <p className="meta-label text-white/70">Modèle {baseSlot}</p>
              <h4 className="mt-4 heading-3 text-balance text-white">
                {motorcycle.brand} {motorcycle.name}
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral" size="sm" className="normal-case border-white/20 bg-white/92 tracking-[0.08em] text-foreground">
                {formatMoney(motorcycle.priceFrom.amount, motorcycle.priceFrom.currency)}/jour
              </Badge>
              <Badge variant="outline" size="sm" className="normal-case border-white/18 bg-white/10 tracking-[0.08em] text-white">
                {formatMoney(motorcycle.deposit.amount, motorcycle.deposit.currency)} dépôt
              </Badge>
              <Badge variant="outline" size="sm" className="normal-case border-white/18 bg-white/10 tracking-[0.08em] text-white">
                Permis {MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]}
              </Badge>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink
                href={`/motos/${motorcycle.slug}`}
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
        </MotorcycleVisual>
      </div>
    </div>
  );
}
