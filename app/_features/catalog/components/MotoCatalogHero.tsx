export function MotoCatalogHero() {
  return (
    <section className="pb-3 sm:pb-5">
      <div className="max-w-4xl space-y-3">
        <h1 className="heading-1 text-foreground text-balance">
          <span className="block sm:hidden">Choisissez la bonne moto.</span>
          <span className="hidden sm:block">
            Définissez votre créneau. Comparez les motos vraiment disponibles.
          </span>
        </h1>
        <p className="body-copy font-medium text-foreground/82">
          Filtrez par créneau, permis et budget avant de réserver.
        </p>
      </div>
    </section>
  );
}
