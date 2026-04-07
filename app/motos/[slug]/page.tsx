import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotorcycleVisual } from "@/app/_features/catalog/components/MotorcycleVisual";
import {
  getMotorcycleDetailContent,
  type MotorcycleGalleryPanel,
} from "@/app/_features/catalog/data/motorcycle-details";
import { MotoAvailabilityPanel } from "@/app/_features/catalog/components/MotoAvailabilityPanel";
import {
  MOTORCYCLE_CATEGORY_LABELS,
  MOTORCYCLE_LICENSE_LABELS,
  MOTORCYCLE_STATUS_META,
  MOTORCYCLE_TRANSMISSION_LABELS,
  type CatalogMotorcycle,
} from "@/app/_features/catalog/data/motorcycles";
import {
  getPlanningContext,
  getPublicCatalog,
  getPublicMotorcycleBySlug,
} from "@/app/_features/ops/data/ops-store";
import Section from "@/app/_shared/components/Section";
import { formatMoney } from "@/app/_shared/lib/format";
import { buildReservationHref } from "@/app/_shared/lib/navigation";
import { Badge } from "@/app/_shared/ui/Badge";
import { Button } from "@/app/_shared/ui/Button";

type MotoDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: MotoDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const motorcycle = await getPublicMotorcycleBySlug(slug);

  if (!motorcycle) {
    return {
      title: "Moto introuvable | Allo Moto",
      description: "Le modèle demandé n’existe pas dans le catalogue.",
    };
  }

  return {
    title: `${motorcycle.brand} ${motorcycle.name} | Allo Moto`,
    description: motorcycle.description,
  };
}

export default async function MotoDetailPage({ params }: MotoDetailPageProps) {
  const { slug } = await params;
  const [motorcycle, catalog, planning] = await Promise.all([
    getPublicMotorcycleBySlug(slug),
    getPublicCatalog(),
    getPlanningContext(),
  ]);
  const content = motorcycle ? getMotorcycleDetailContent(slug) : null;

  if (!motorcycle) {
    notFound();
  }

  if (!content) {
    notFound();
  }

  const statusMeta = MOTORCYCLE_STATUS_META[motorcycle.status];
  const relatedMotorcycles = content.relatedSlugs
    .map((relatedSlug) =>
      catalog.find((candidate) => candidate.slug === relatedSlug) ?? null,
    )
    .filter(Boolean) as CatalogMotorcycle[];

  return (
    <main className="app-shell">
      <section className="section-shell pt-0">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/motos" className="transition-colors hover:text-foreground">
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-foreground">{motorcycle.brand} {motorcycle.name}</span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="section-band panel-space">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{MOTORCYCLE_CATEGORY_LABELS[motorcycle.category]}</Badge>
              <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>
              <Badge variant="outline">{MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]}</Badge>
            </div>

            <div className="mt-5 space-y-4">
              <h1 className="heading-1 text-foreground text-balance">
                {motorcycle.brand} {motorcycle.name}
              </h1>
              <p className="max-w-2xl body-copy text-muted-foreground">{content.summary}</p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat label="Prix / jour" value={formatMoney(motorcycle.priceFrom.amount, motorcycle.priceFrom.currency)} />
              <MiniStat label="Dépôt" value={formatMoney(motorcycle.deposit.amount, motorcycle.deposit.currency)} />
              <MiniStat label="Permis" value={MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]} />
              <MiniStat label="Transmission" value={MOTORCYCLE_TRANSMISSION_LABELS[motorcycle.transmission]} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                as="link"
                href={`${buildReservationHref(motorcycle.slug, {
                  stage: "selection",
                })}#reservation-form`}
                ariaLabel={`Vérifier les dates pour ${motorcycle.brand} ${motorcycle.name}`}
                variant="accent"
                size="lg"
              >
                Vérifier mes dates
              </Button>
              <Button as="link" href="/motos" ariaLabel="Retourner au catalogue" variant="outline" size="lg">
                Retour au catalogue
              </Button>
            </div>
          </div>

          <MotorcycleVisual motorcycle={motorcycle} className="min-h-[32rem] p-4 sm:p-6" priority>
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="label">Fiche moto</p>
                  <h2 className="mt-4 heading-2 text-foreground">{motorcycle.brand} {motorcycle.name}</h2>
                  <p className="mt-4 body-copy text-muted-foreground">{motorcycle.heroTag}</p>
                </div>
                <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>
              </div>

              <div className="overlay-sheet p-4 sm:p-6">
                <div className="grid gap-2 sm:grid-cols-2">
                  <MiniStat label="Km inclus / jour" value={`${motorcycle.includedMileageKmPerDay} km`} />
                  <MiniStat label="Retrait" value={motorcycle.locationLabel} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {motorcycle.decisionTags.map((tag) => (
                    <Badge key={tag} variant="neutral" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </MotorcycleVisual>
        </div>
      </section>

      <Section
        title="Verifier le creneau"
        subtitle="La disponibilite ci-dessous tient compte du planning, des buffers et de la capacite de retrait."
      >
        <MotoAvailabilityPanel
          motorcycle={motorcycle}
          initialPlanningReservations={planning.reservations}
          initialPlanningBlocks={planning.blocks}
        />
      </Section>

      <Section
        title="Pourquoi cette moto ?"
        subtitle="Le moteur, le format et le prix s’expriment sans détour."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {content.whyPoints.map((point) => (
            <div key={point} className="section-band panel-space">
              <p className="body-copy text-foreground/82">{point}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Lecture rapide"
        subtitle="Les panneaux suivants aident à comparer la moto sans tableau lourd."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {content.galleryPanels.map((panel) => (
            <GalleryPanel key={panel.title} panel={panel} />
          ))}
        </div>
      </Section>

      <Section title="Ce qui est inclus" subtitle="L’essentiel, puis la suite.">
        <div className="grid gap-4 xl:grid-cols-2">
          <ListPanel title="Inclus" items={content.included} tone="success" />
          <ListPanel title="Non inclus" items={content.notIncluded} tone="warning" />
        </div>
      </Section>

      <Section title="Avant de réserver" subtitle="Ce qu’il faut préparer pour aller vite.">
        <div className="grid gap-4 xl:grid-cols-2">
          <ListPanel title="À préparer" items={content.prepare} tone="accent" />
          <ListPanel title="Rassurance" items={content.reassurance} tone="neutral" />
        </div>
      </Section>

      {relatedMotorcycles.length > 0 ? (
        <Section title="Modèles proches" subtitle="Quelques alternatives utiles si vous voulez comparer.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedMotorcycles.map((related) => (
              <RelatedMotorcycleRow key={related.slug} motorcycle={related} />
            ))}
          </div>
        </Section>
      ) : null}
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border/60 bg-surface/72 p-4">
      <p className="meta-label">{label}</p>
      <p className="mt-2 body-copy font-semibold text-foreground">{value}</p>
    </div>
  );
}

function GalleryPanel({ panel }: { panel: MotorcycleGalleryPanel }) {
  return (
    <div className="section-band panel-space">
      <div className="space-y-3">
        <Badge variant="neutral" size="sm">
          {panel.eyebrow}
        </Badge>
        <h3 className="heading-3 text-foreground">{panel.title}</h3>
        <p className="body-copy text-muted-foreground">{panel.copy}</p>
        <p className="meta-label">{panel.metric}</p>
      </div>
    </div>
  );
}

function ListPanel({ title, items, tone }: { title: string; items: readonly string[]; tone: "success" | "warning" | "accent" | "neutral" }) {
  return (
    <div className="section-band panel-space">
      <div className="flex items-center justify-between gap-3">
        <h3 className="heading-3 text-foreground">{title}</h3>
        <Badge variant={tone}>{title}</Badge>
      </div>
      <ul className="mt-4 grid gap-3">
        {items.map((item) => (
          <li key={item} className="rounded-card border border-border/60 bg-surface/72 px-4 py-3 text-sm text-foreground/80">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedMotorcycleRow({ motorcycle }: { motorcycle: CatalogMotorcycle }) {
  const statusMeta = MOTORCYCLE_STATUS_META[motorcycle.status];

  return (
    <div className="section-band panel-space">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="meta-label">{motorcycle.brand}</p>
            <h3 className="mt-4 heading-3 text-foreground">{motorcycle.name}</h3>
          </div>
          <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>
        </div>

        <div className="grid gap-2">
          <MiniStat label="Prix" value={formatMoney(motorcycle.priceFrom.amount, motorcycle.priceFrom.currency)} />
          <MiniStat label="Permis" value={MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button as="link" href={`/motos/${motorcycle.slug}`} ariaLabel={`Voir la fiche de ${motorcycle.brand} ${motorcycle.name}`} variant="accent" size="md">
            Voir la fiche
          </Button>
          <Button
            as="link"
            href={`${buildReservationHref(motorcycle.slug, {
              stage: "selection",
            })}#reservation-form`}
            ariaLabel={`Choisir ${motorcycle.brand} ${motorcycle.name} puis vérifier le créneau`}
            variant="outline"
            size="md"
          >
            Choisir ce modèle
          </Button>
        </div>
      </div>
    </div>
  );
}
