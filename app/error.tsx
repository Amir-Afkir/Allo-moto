"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="app-shell py-12">
      <section className="section-shell space-y-5" role="alert">
        <h1 className="heading-2">Cette page est temporairement indisponible.</h1>
        <p>Vos données enregistrées ne sont pas supprimées. Réessayez dans un instant.</p>
        <button type="button" onClick={reset} className="min-h-11 rounded-pill border px-6 py-3">
          Réessayer
        </button>
      </section>
    </main>
  );
}
