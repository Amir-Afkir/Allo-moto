"use client";

import Link from "next/link";
import { type CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";
import { formatDateRange, type ReservationDraft, type ReservationEvaluation } from "@/app/_features/reservation/data/reservation";
import type {
  ReservationClientDraft,
  ReservationClientValidation,
} from "@/app/_features/reservation/data/reservation-intake";
import { formatMoney } from "@/app/_shared/lib/format";
import { Button } from "@/app/_shared/ui/Button";
import { EmptyState } from "@/app/_shared/ui/EmptyState";

type ReservationPaymentProps = {
  motorcycle: CatalogMotorcycle | null;
  draft: ReservationDraft;
  clientDraft: ReservationClientDraft;
  clientValidation: ReservationClientValidation;
  evaluation: ReservationEvaluation;
  dossierHref: string;
  followupHref: string;
  conditionsHref: string;
  submitError?: string | null;
  isSubmitting?: boolean;
  onSubmitReservation: () => Promise<void> | void;
};

export function ReservationPayment({
  motorcycle,
  draft,
  clientDraft,
  clientValidation,
  evaluation,
  dossierHref,
  followupHref,
  conditionsHref,
  submitError,
  isSubmitting = false,
  onSubmitReservation,
}: ReservationPaymentProps) {
  const readyToSubmit = Boolean(
    motorcycle && evaluation.available && clientValidation.readyForReview,
  );

  if (!motorcycle) {
    return (
      <section className="border-b border-border/60 pb-8">
        <EmptyState
          title="La demande n'est pas prête."
          description="Choisissez une moto, vérifiez le créneau, puis complétez le dossier."
          action={
            <Button
              as="link"
              href="/motos"
              ariaLabel="Retourner au catalogue de motos"
              variant="accent"
              size="md"
            >
              Ouvrir le catalogue
            </Button>
          }
        />
      </section>
    );
  }

  const fullName =
    [clientDraft.firstName, clientDraft.lastName].filter(Boolean).join(" ") ||
    "Client à confirmer";

  const summaryFacts = [
    {
      label: "Location",
      value: formatMoney(
        motorcycle.priceFrom.amount * Math.max(evaluation.durationDays, 1),
        motorcycle.priceFrom.currency,
      ),
      note: `${Math.max(evaluation.durationDays, 1)} jour${evaluation.durationDays > 1 ? "s" : ""}`,
    },
    {
      label: "Dépôt",
      value: formatMoney(
        motorcycle.deposit.amount,
        motorcycle.deposit.currency,
      ),
      note: "À régler ou autoriser au retrait",
    },
    {
      label: "Paiement",
      value: "Au retrait",
      note: "Pas de paiement en ligne pour le moment",
    },
  ];

  return (
    <section id="send-form" className="space-y-8 border-b border-border/60 pb-8">
      <div className="grid gap-x-6 gap-y-4 border-y border-border/60 py-4 sm:grid-cols-3">
        {summaryFacts.map((fact) => (
          <div key={fact.label} className="space-y-1.5">
            <p className="meta-label">{fact.label}</p>
            <p className="heading-3 text-[clamp(1.1rem,3vw,1.4rem)] leading-none text-foreground">
              {fact.value}
            </p>
            <p className="text-sm text-muted-foreground">{fact.note}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <p className="label">Récapitulatif</p>
          <h3 className="mt-3 heading-3 text-foreground">
            {motorcycle.brand} {motorcycle.name}
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ReviewFact label="Client" value={fullName} />
          <ReviewFact
            label="Période"
            value={formatDateRange(draft.pickupDate, draft.returnDate)}
          />
          <ReviewFact label="Retrait" value={evaluation.pickupLabel} />
          <ReviewFact
            label="Contact"
            value={clientDraft.email || clientDraft.phone || "À compléter"}
          />
        </div>
      </div>

      <div className="space-y-3 border-y border-border/60 px-4 py-4">
        <p className="body-copy font-semibold text-foreground">
          À prévoir pour le retrait
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="space-y-1">
            <p className="meta-label">Permis</p>
            <p className="text-sm text-foreground/78">
              Apportez votre permis original le jour du retrait.
            </p>
          </li>
          <li className="space-y-1">
            <p className="meta-label">Pièce d&apos;identité</p>
            <p className="text-sm text-foreground/78">
              Une pièce d&apos;identité en cours de validité pourra être demandée.
            </p>
          </li>
          <li className="space-y-1">
            <p className="meta-label">Acompte / dépôt</p>
            <p className="text-sm text-foreground/78">
              Le dépôt est à régler ou autoriser sur place au retrait.
            </p>
          </li>
          <li className="space-y-1">
            <p className="meta-label">Paiement</p>
            <p className="text-sm text-foreground/78">
              Le paiement de la location se fera au retrait.
            </p>
          </li>
        </ul>
      </div>

      <div className="space-y-3 border-t border-border/60 pt-6">
        <p className="text-sm text-muted-foreground">
          Une référence sera créée à l&apos;envoi. Nous reviendrons vers vous pour
          confirmer la réservation.
        </p>
        {submitError ? (
          <p className="rounded-card border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
            {submitError}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border/60 pt-6">
        <p className="text-sm text-muted-foreground">
          {formatDateRange(draft.pickupDate, draft.returnDate)} · {fullName}
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <Button
            as="button"
            type="button"
            ariaLabel="Envoyer la demande de réservation"
            variant={readyToSubmit ? "accent" : "outline"}
            size="lg"
            onClick={onSubmitReservation}
            disabled={!readyToSubmit || isSubmitting}
          >
            {isSubmitting ? "Envoi en cours" : "Envoyer la demande"}
          </Button>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              href={dossierHref}
              aria-label="Retourner au dossier client"
              className="font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              Retour au dossier
            </Link>
            <Link
              href={conditionsHref}
              aria-label="Relire les conditions de location"
              className="font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              Voir les conditions
            </Link>
            {readyToSubmit ? (
              <Link
                href={followupHref}
                aria-label="Voir le suivi de réservation"
                className="font-semibold text-brand transition-colors hover:text-brand-strong"
              >
                Voir le suivi
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 border-b border-border/60 pb-3">
      <p className="meta-label">{label}</p>
      <p className="mt-2 text-[0.95rem] font-semibold leading-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
