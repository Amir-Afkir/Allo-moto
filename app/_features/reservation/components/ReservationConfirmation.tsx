"use client";

import Link from "next/link";
import { useState } from "react";
import { type CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";
import type { ReservationConfirmationSnapshot } from "@/app/_features/reservation/data/reservation-confirmation";
import { Button } from "@/app/_shared/ui/Button";
import { EmptyState } from "@/app/_shared/ui/EmptyState";

type ReservationConfirmationProps = {
  motorcycle: CatalogMotorcycle | null;
  snapshot: ReservationConfirmationSnapshot;
  catalogHref: string;
  motorcycleHref: string;
  dossierHref: string;
  clientHref: string;
  paymentHref: string;
  conditionsHref: string;
};

export function ReservationConfirmation({
  motorcycle,
  snapshot,
  catalogHref,
  motorcycleHref,
  dossierHref,
  clientHref,
  paymentHref,
  conditionsHref,
}: ReservationConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const summaryMotorcycle = motorcycle ?? null;
  const contactValue =
    snapshot.supportLines.find((line) => line.label === "Contact")?.value ??
    "À compléter";

  async function handleCopyReference() {
    try {
      await navigator.clipboard.writeText(snapshot.shareCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (!summaryMotorcycle) {
    return (
      <section className="border-b border-border/60 pb-8">
        <EmptyState
          title="Le suivi n'est pas prêt."
          description="Revenez au dossier pour terminer la demande."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                as="link"
                href={dossierHref}
                ariaLabel="Retourner au dossier client"
                variant="accent"
                size="md"
              >
                Retour au dossier
              </Button>
              <Button
                as="link"
                href={paymentHref}
                ariaLabel="Revenir à la validation"
                variant="outline"
                size="md"
              >
                Retour à la validation
              </Button>
            </div>
          }
        />
      </section>
    );
  }

  return (
    <section id="confirmation" className="space-y-8 border-b border-border/60 pb-8">
      <div className="space-y-3 border-b border-border/60 pb-6">
        <h2 className="heading-2 text-foreground">
          {snapshot.state === "confirmed"
            ? "Votre réservation est confirmée."
            : snapshot.state === "pending_validation"
              ? "Votre demande a bien été envoyée."
              : "Votre demande doit encore être complétée."}
        </h2>
        <p className="max-w-2xl body-copy text-muted-foreground">
          {snapshot.heroCopy}
        </p>
        <p className="text-sm text-muted-foreground">{snapshot.statusNote}</p>
      </div>

      <div className="flex flex-col gap-4 border-y border-border/60 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="meta-label">Reference</p>
          <p className="heading-3 text-foreground">{snapshot.referenceValue}</p>
          <p className="text-sm text-muted-foreground">
            {snapshot.referenceNote}
          </p>
        </div>

        <Button
          as="button"
          type="button"
          ariaLabel="Copier la référence de réservation"
          variant="outline"
          size="md"
          onClick={handleCopyReference}
        >
          {copied ? "Référence copiée" : "Copier la référence"}
        </Button>
      </div>

      {snapshot.blockingItems.length > 0 ? (
        <div className="rounded-card border border-warning/20 bg-warning/8 p-4">
          <p className="body-copy font-semibold text-foreground">À corriger</p>
          <ul className="mt-3 space-y-2 body-copy text-foreground/78">
            {snapshot.blockingItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[0.45rem] h-1.5 w-1.5 flex-none rounded-full bg-warning" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-4 border-t border-border/60 pt-6">
        <div className="space-y-2">
          <p className="label">Suite</p>
          <p className="text-sm text-muted-foreground">
            {snapshot.state === "confirmed"
              ? "Conservez la référence et présentez-vous au retrait pour régler la location."
              : snapshot.state === "pending_validation"
                ? "Nous reviendrons vers vous pour confirmer la réservation. Le paiement se fera au retrait."
                : "Revenez au dossier pour compléter les éléments manquants."}
          </p>
          <p className="text-sm text-muted-foreground">
            Contact de suivi : {contactValue}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {snapshot.state === "confirmed" ? (
            <Button
              as="link"
              href={catalogHref}
              ariaLabel="Retourner au catalogue"
              variant="accent"
              size="lg"
            >
              Retour au catalogue
            </Button>
          ) : snapshot.state === "pending_validation" ? (
            <Button
              as="link"
              href={catalogHref}
              ariaLabel="Retourner à la page motos"
              variant="accent"
              size="lg"
            >
              Voir les motos
            </Button>
          ) : (
            <Button
              as="link"
              href={clientHref}
              ariaLabel="Retourner au dossier client"
              variant="accent"
              size="lg"
            >
              Retour au dossier
            </Button>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              href={snapshot.state === "confirmed" ? motorcycleHref : dossierHref}
              className="font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              {snapshot.state === "confirmed"
                ? "Voir la fiche moto"
                : "Retour au dossier"}
            </Link>
            <Link
              href={conditionsHref}
              className="font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              Voir les conditions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
