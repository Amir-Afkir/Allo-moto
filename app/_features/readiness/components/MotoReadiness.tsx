import Link from "next/link";
import Section from "@/app/_shared/components/Section";
import { CATALOG_AVAILABILITY_HREF } from "@/app/_shared/lib/navigation";
import { Badge } from "@/app/_shared/ui/Badge";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";
import {
  buildSupportWhatsAppHref,
  getSupportConfig,
} from "@/app/_features/support/data/support";

const equipmentItems = [
  {
    label: "Casque",
    status: "Obligatoire",
    copy: "Casque homologué requis. Prêt possible selon disponibilité, taille à confirmer avant le retrait.",
  },
  {
    label: "Gants",
    status: "Obligatoires",
    copy: "Gants homologués nécessaires à moto ou scooter. Apportez les vôtres ou demandez selon disponibilité.",
  },
  {
    label: "Blouson",
    status: "Recommandé",
    copy: "Tenue couvrante conseillée, surtout hors ville ou selon la météo.",
  },
  {
    label: "Documents",
    status: "À présenter",
    copy: "Permis, pièce d’identité, moyen de paiement et dépôt sont vérifiés avant départ.",
  },
] as const;

const licenseItems = [
  {
    label: "A1",
    title: "Scooters et motos légères",
    copy: "Pour les trajets urbains, les sorties courtes et les modèles compatibles.",
  },
  {
    label: "A2",
    title: "Roadsters, trails légers, scooters premium",
    copy: "Le bon compromis pour les balades autour d’Orléans et les motos limitées à 35 kW.",
  },
  {
    label: "A",
    title: "Touring, custom, sportives",
    copy: "Pour les modèles les plus puissants et les longues sorties à la journée.",
  },
] as const;

const whatsappMessage =
  "Bonjour, j’ai une question sur l’équipement ou le permis avant de réserver une moto.";

export default async function MotoReadiness() {
  const support = await getSupportConfig();
  const whatsappHref = buildSupportWhatsAppHref(
    support.whatsappPhoneDigits,
    whatsappMessage,
  );

  return (
    <Section
      id="equipment-license"
      title="Permis vérifié, équipement à prévoir."
      subtitle="Avant de réserver, vérifiez le permis demandé et les éléments à préparer pour le retrait."
      className="section-deferred border-y border-border/60 bg-[linear-gradient(180deg,rgba(247,242,233,0.86)_0%,rgba(253,247,239,0.72)_100%)]"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <section
          aria-labelledby="readiness-license-title"
          className="order-1 space-y-4"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
            <Badge variant="accent" size="sm">
              Permis
            </Badge>
            <h3
              id="readiness-license-title"
              className="text-[1.25rem] font-bold leading-tight tracking-[-0.02em] text-foreground"
            >
              Permis vérifié
            </h3>
          </div>

          <ul className="divide-y divide-border/60">
            {licenseItems.map((item) => (
              <li
                key={item.label}
                className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-4 py-4 first:pt-0 last:pb-0"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-brand-600/20 bg-brand-soft text-sm font-bold text-brand-700">
                  {item.label}
                </span>
                <span className="min-w-0 space-y-1.5">
                  <h4 className="text-[1rem] font-semibold leading-6 text-foreground text-balance">
                    {item.title}
                  </h4>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.copy}
                  </p>
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-border/60 pt-5 lg:hidden">
            <ButtonLink
              href={CATALOG_AVAILABILITY_HREF}
              ariaLabel="Voir les motos compatibles avec mon permis"
              variant="accent"
              size="lg"
              className="min-h-11 w-full"
            >
              Voir les motos compatibles
            </ButtonLink>
          </div>
        </section>

        <section
          aria-labelledby="readiness-equipment-title"
          className="order-3 space-y-4 lg:order-2 lg:border-l lg:border-border/60 lg:pl-7"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
            <Badge variant="neutral" size="sm">
              Avant départ
            </Badge>
            <h3
              id="readiness-equipment-title"
              className="text-[1.25rem] font-bold leading-tight tracking-[-0.02em] text-foreground"
            >
              À préparer
            </h3>
          </div>

          <ul className="divide-y divide-border/60">
            {equipmentItems.map((item) => (
              <li
                key={item.label}
                className="grid gap-2 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-[1.05rem] font-semibold leading-6 text-foreground">
                    {item.label}
                  </h4>
                  <span className="shrink-0 whitespace-nowrap rounded-control border border-border/70 bg-surface-elevated px-2 py-1 text-[0.68rem] font-semibold uppercase leading-none tracking-[0.1em] text-foreground/72">
                    {item.status}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.copy}
                </p>
              </li>
            ))}
          </ul>

          {whatsappHref ? (
            <div className="border-t border-border/60 pt-5 lg:hidden">
              <Link
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                aria-label="Demander conseil sur l’équipement ou le permis via WhatsApp"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-border/70 bg-surface/88 px-6 py-3 text-sm font-semibold text-foreground shadow-[0_1px_10px_rgba(23,20,16,0.05)] transition-colors hover:border-brand/20 hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Demander sur WhatsApp
              </Link>
            </div>
          ) : null}
        </section>

        <div className="order-4 hidden flex-col gap-3 border-t border-border/60 pt-6 lg:col-span-2 lg:flex lg:flex-row">
          <ButtonLink
            href={CATALOG_AVAILABILITY_HREF}
            ariaLabel="Voir les motos compatibles avec mon permis"
            variant="accent"
            size="lg"
            className="min-h-11 w-full sm:w-auto"
          >
            Voir les motos compatibles
          </ButtonLink>

          {whatsappHref ? (
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              aria-label="Demander conseil sur l’équipement ou le permis via WhatsApp"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-border/70 bg-surface/88 px-6 py-3 text-sm font-semibold text-foreground shadow-[0_1px_10px_rgba(23,20,16,0.05)] transition-colors hover:border-brand/20 hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
            >
              Demander sur WhatsApp
            </Link>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
