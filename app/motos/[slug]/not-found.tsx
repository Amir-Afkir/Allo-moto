import { ButtonLink } from "@/app/_shared/ui/ButtonLink";
import { EmptyState } from "@/app/_shared/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="app-shell">
      <section className="section-shell pt-0">
        <EmptyState
          title="Moto introuvable"
          description="Ce modèle n’existe pas dans le catalogue actuel ou n’est plus publié."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/motos" ariaLabel="Voir les motos" variant="accent" size="lg">
                Voir les motos
              </ButtonLink>
              <ButtonLink href="/" ariaLabel="Retour à l’accueil" variant="outline" size="lg">
                Retour à l’accueil
              </ButtonLink>
            </div>
          }
        />
      </section>
    </main>
  );
}
