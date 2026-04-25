import Link from "next/link";
import Section from "@/app/_shared/components/Section";
import { Badge } from "@/app/_shared/ui/Badge";
import { getSupportConfig } from "@/app/_features/support/data/support";
import SupportMapboxCard from "./SupportMapboxCard";
import WhatsAppButton from "./WhatsAppButton";

const supportTopics = ["Permis requis", "Dépôt annoncé", "Retrait"] as const;

export default async function MotoSupport() {
  const support = await getSupportConfig();

  return (
    <Section
      id="help"
      title="Besoin d’aide avant de réserver ?"
      subtitle="Un message suffit pour vérifier le permis, le dépôt ou le retrait avant de passer au paiement."
      className="section-deferred"
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SupportMapboxCard map={support.map} placeName={support.placeName} addressLines={support.addressLines} />

        <div className="section-band panel-space flex h-full flex-col space-y-6">
          <div className="space-y-4">
            <Badge variant="accent" size="sm">
              Support direct
            </Badge>
            <div className="space-y-2">
              <h3 className="heading-3 max-w-[22rem] text-foreground text-balance">
                Une question avant de réserver ?
              </h3>
              <p className="body-copy max-w-[30rem] text-muted-foreground">
                Permis, dépôt ou retrait : on répond avant le paiement.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {supportTopics.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center justify-center rounded-pill border border-border/70 bg-surface px-4 py-2 text-sm font-semibold text-foreground/72"
              >
                {topic}
              </span>
            ))}
          </div>

          <div className="space-y-4 border-t border-border/60 pt-4">
            <WhatsAppButton href={support.whatsappHref} className="w-full" />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {support.mapsHref ? (
                <Link
                  href={support.mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand transition-colors hover:text-brand-strong"
                >
                  Voir la carte
                </Link>
              ) : null}
              {support.phoneHref ? (
                <Link
                  href={support.phoneHref}
                  className="font-semibold text-brand transition-colors hover:text-brand-strong"
                >
                  Appeler
                </Link>
              ) : null}
              <Link
                href="/conditions"
                className="font-semibold text-brand transition-colors hover:text-brand-strong"
              >
                Voir les conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
