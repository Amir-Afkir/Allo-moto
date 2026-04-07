import ContentPageShell from "@/app/_shared/components/ContentPageShell";

export default function ConditionsPage() {
  const currentDate = new Date().toLocaleDateString("fr-FR");

  return (
    <ContentPageShell
      eyebrow="Légal"
      title="Conditions d’utilisation"
      subtitle={`Dernière mise à jour : ${currentDate}`}
      backHref="/"
      backLabel="Retour à l’accueil"
    >
      <div className="grid gap-4">
        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Objet</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            Allo Moto présente un catalogue de motos à louer et un tunnel de réservation pour vérifier le permis, la
            disponibilité, les dates et le dossier client.
          </p>
        </div>

        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Utilisation du site</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            L’utilisateur s’engage à fournir des informations exactes, à utiliser le service de manière licite et à
            ne pas perturber son fonctionnement.
          </p>
        </div>

        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Réservation</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            La réservation n’est effective qu’après vérification des éléments requis, validation du dossier et, le
            cas échéant, ouverture du paiement sécurisé.
          </p>
        </div>

        <div className="section-band panel-space">
          <h2 className="heading-3 text-foreground">Responsabilité</h2>
          <p className="mt-3 body-copy text-muted-foreground">
            Les informations affichées sont données à titre indicatif. Les conditions finales de location restent celles
            communiquées au moment de la confirmation.
          </p>
        </div>
      </div>
    </ContentPageShell>
  );
}
