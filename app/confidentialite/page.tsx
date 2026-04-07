import ContentPageShell from "@/app/_shared/components/ContentPageShell";

export default function PolitiqueConfidentialitePage() {
  const currentDate = new Date().toLocaleDateString("fr-FR");

  return (
    <ContentPageShell
      eyebrow="Confidentialité"
      title="Politique de confidentialité"
      subtitle={`Dernière mise à jour : ${currentDate}`}
      backHref="/"
      backLabel="Retour à l’accueil"
    >
      <div className="grid gap-4">
        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Données collectées</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            Nous collectons les informations nécessaires pour préparer une réservation: nom, contact, permis, dates et
            éventuelles notes utiles.
          </p>
        </div>

        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Utilisation</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            Les données servent uniquement à vérifier la compatibilité de la réservation, préparer le dossier et
            échanger avec vous si besoin.
          </p>
        </div>

        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Partage</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            Les informations ne sont pas revendues. Elles peuvent être transmises à des prestataires techniques
            nécessaires au fonctionnement du service.
          </p>
        </div>

        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Vos droits</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            Vous pouvez demander l’accès, la rectification ou la suppression de vos données en nous contactant via les
            canaux de support affichés sur le site.
          </p>
        </div>
      </div>
    </ContentPageShell>
  );
}
