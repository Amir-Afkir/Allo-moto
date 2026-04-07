import Link from "next/link";
import { getSupportConfig } from "@/app/_features/support/data/support";
import ContentPageShell from "@/app/_shared/components/ContentPageShell";

export default async function MentionsLegalesPage() {
  const currentDate = new Date().toLocaleDateString("fr-FR");
  const support = await getSupportConfig();

  return (
    <ContentPageShell
      eyebrow="Légal"
      title="Mentions légales"
      subtitle={`Dernière mise à jour : ${currentDate}`}
      backHref="/"
      backLabel="Retour à l’accueil"
    >
      <div className="grid gap-4">
        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Éditeur</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            Allo Moto. Les informations juridiques complètes du propriétaire de l’activité doivent être renseignées ici
            avant mise en production.
          </p>
        </div>

        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Hébergement</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            Le site est hébergé sur une infrastructure tierce adaptée au déploiement Next.js.
          </p>
        </div>

        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Contact</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            <span className="font-semibold text-foreground">{support.placeName}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-brand">
            {support.phoneHref ? (
              <Link href={support.phoneHref} className="transition-colors hover:text-brand-strong">
                Appeler
              </Link>
            ) : null}
            {support.mapsHref ? (
              <Link href={support.mapsHref} target="_blank" rel="noreferrer" className="transition-colors hover:text-brand-strong">
                Voir la carte
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </ContentPageShell>
  );
}
