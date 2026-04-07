"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { type CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";
import { cn } from "@/app/_shared/lib/cn";
import { Button } from "@/app/_shared/ui/Button";
import { EmptyState } from "@/app/_shared/ui/EmptyState";
import { Input } from "@/app/_shared/ui/Input";
import { Label } from "@/app/_shared/ui/Label";
import {
  RESERVATION_DOCUMENT_OPTIONS,
  RESERVATION_PREFERRED_CONTACT_OPTIONS,
  type ReservationClientDraft,
  type ReservationClientValidation,
} from "@/app/_features/reservation/data/reservation-intake";

type ReservationClientDossierProps = {
  motorcycle: CatalogMotorcycle | null;
  validation: ReservationClientValidation;
  draft: ReservationClientDraft;
  lastSavedLabel: string | null;
  backHref: string;
  onChange: <K extends keyof ReservationClientDraft>(
    key: K,
    value: ReservationClientDraft[K],
  ) => void;
  onPrepareNextStep: () => void;
};

export function ReservationClientDossier({
  motorcycle,
  validation,
  draft,
  lastSavedLabel,
  backHref,
  onChange,
  onPrepareNextStep,
}: ReservationClientDossierProps) {
  const [saveAttempted, setSaveAttempted] = useState(false);
  const permitCompatibilityMessage = validation.permitCompatibilityMessage;
  const permitFieldError =
    permitCompatibilityMessage ??
    (saveAttempted ? validation.errors.permitType : undefined);
  const optionalFieldsOpen =
    draft.country.trim().length > 0 ||
    draft.permitNumber.trim().length > 0 ||
    draft.documentType !== "none" ||
    draft.documentNumber.trim().length > 0 ||
    draft.notes.trim().length > 0;
  const missingRequiredCopy = validation.missingRequiredLabels.join(", ");

  if (!motorcycle) {
    return (
      <section className="border-b border-border/60 pb-8">
        <EmptyState
          title="Aucune moto n’est prête."
          description="Retournez à la vérification ou choisissez une moto."
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveAttempted(true);

    if (permitCompatibilityMessage) {
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          const element = document.getElementById("client-permit-type");
          if (!(element instanceof HTMLElement)) {
            return;
          }

          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        });
      }
      return;
    }

    onPrepareNextStep();

    if (validation.readyForReview || typeof window === "undefined") {
      return;
    }

    const firstInvalidId = validation.errors.firstName
      ? "client-first-name"
      : validation.errors.lastName
        ? "client-last-name"
        : validation.errors.email
          ? "client-email"
          : validation.errors.phone
            ? "client-phone"
            : validation.errors.preferredContact
              ? "client-contact"
              : validation.errors.permitType
                ? "client-permit-type"
                : validation.errors.documentNumber
                  ? "client-document-number"
                  : validation.errors.consentDataUse
                    ? "client-consent"
                    : null;

    if (!firstInvalidId) {
      return;
    }

    window.requestAnimationFrame(() => {
      const element = document.getElementById(firstInvalidId);
      if (!(element instanceof HTMLElement)) {
        return;
      }

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-5 border-b border-border/60 pb-8">
        <div className="max-w-2xl space-y-3">
          <h2 className="heading-2 text-foreground">Renseignez votre dossier.</h2>
          <p className="body-copy text-muted-foreground">
            Coordonnees, permis et consentement suffisent pour continuer.
          </p>
        </div>
        <div
          className={cn(
            "border-y px-4 py-3 text-sm",
            validation.readyForReview
              ? "border-success/20 bg-success/8 text-foreground/80"
              : "border-warning/20 bg-warning/8 text-foreground/80",
          )}
        >
          {permitCompatibilityMessage ? (
            <p>
              <span className="font-semibold text-foreground">Permis incompatible:</span>{" "}
              {permitCompatibilityMessage}
            </p>
          ) : validation.readyForReview ? (
            <p>Dossier complet. Vous pouvez continuer.</p>
          ) : (
            <p>
              <span className="font-semibold text-foreground">
                Champs requis manquants:
              </span>{" "}
              {missingRequiredCopy}
            </p>
          )}
        </div>
      </section>

      <form
        id="client-form"
        className="space-y-8 border-b border-border/60 pb-8"
        onSubmit={handleSubmit}
      >
        <div className="border-b border-border/60 pb-6">
          <div>
            <p className="label">Champs requis</p>
            <h3 className="mt-3 heading-3 text-foreground">
              Coordonnées et permis.
            </h3>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-foreground">Coordonnées</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Prénom"
                htmlFor="client-first-name"
                error={saveAttempted ? validation.errors.firstName : undefined}
              >
                <Input
                  id="client-first-name"
                  autoComplete="given-name"
                  value={draft.firstName}
                  onChange={(event) =>
                    onChange("firstName", event.target.value)
                  }
                  className={
                    validation.errors.firstName && saveAttempted
                      ? "border-error/35 focus-visible:ring-error/35"
                      : undefined
                  }
                />
              </Field>
              <Field
                label="Nom"
                htmlFor="client-last-name"
                error={saveAttempted ? validation.errors.lastName : undefined}
              >
                <Input
                  id="client-last-name"
                  autoComplete="family-name"
                  value={draft.lastName}
                  onChange={(event) => onChange("lastName", event.target.value)}
                  className={
                    validation.errors.lastName && saveAttempted
                      ? "border-error/35 focus-visible:ring-error/35"
                      : undefined
                  }
                />
              </Field>
              <Field
                label="Email"
                htmlFor="client-email"
                error={saveAttempted ? validation.errors.email : undefined}
              >
                <Input
                  id="client-email"
                  type="email"
                  autoComplete="email"
                  value={draft.email}
                  onChange={(event) => onChange("email", event.target.value)}
                  className={
                    validation.errors.email && saveAttempted
                      ? "border-error/35 focus-visible:ring-error/35"
                      : undefined
                  }
                />
              </Field>
              <Field
                label="Téléphone"
                htmlFor="client-phone"
                error={saveAttempted ? validation.errors.phone : undefined}
              >
                <Input
                  id="client-phone"
                  type="tel"
                  autoComplete="tel"
                  value={draft.phone}
                  onChange={(event) => onChange("phone", event.target.value)}
                  className={
                    validation.errors.phone && saveAttempted
                      ? "border-error/35 focus-visible:ring-error/35"
                      : undefined
                  }
                />
              </Field>
              <Field
                label="Préférence de contact"
                htmlFor="client-contact"
                error={
                  saveAttempted ? validation.errors.preferredContact : undefined
                }
              >
                <select
                  id="client-contact"
                  value={draft.preferredContact}
                  onChange={(event) =>
                    onChange(
                      "preferredContact",
                      event.target
                        .value as ReservationClientDraft["preferredContact"],
                    )
                  }
                  className={cn(
                    "input-shell appearance-none pr-10",
                    validation.errors.preferredContact && saveAttempted
                      ? "border-error/35 focus-visible:ring-error/35"
                      : "",
                  )}
                >
                  {RESERVATION_PREFERRED_CONTACT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          <div>
            <p className="text-sm font-semibold text-foreground">Permis</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Type de permis"
                htmlFor="client-permit-type"
                error={permitFieldError}
              >
                <select
                  id="client-permit-type"
                  value={draft.permitType}
                  onChange={(event) =>
                    onChange(
                      "permitType",
                      event.target
                        .value as ReservationClientDraft["permitType"],
                    )
                  }
                  className={cn(
                    "input-shell appearance-none pr-10",
                    permitFieldError
                      ? "border-error/35 focus-visible:ring-error/35"
                      : "",
                  )}
                >
                  <option value="none">Sélectionnez</option>
                  <option value="B">B</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="A">A</option>
                </select>
              </Field>
            </div>
          </div>

          <details
            className="group border-t border-border/60 pt-6"
            open={optionalFieldsOpen}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Infos utiles
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {validation.optionalCompleteCount}/{validation.optionalCount}{" "}
                  champs facultatifs renseignés
                </p>
              </div>
              <span className="text-sm font-semibold text-brand transition-transform group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="mt-5 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Pays ou nationalité" htmlFor="client-country">
                  <Input
                    id="client-country"
                    autoComplete="country-name"
                    value={draft.country}
                    onChange={(event) =>
                      onChange("country", event.target.value)
                    }
                  />
                </Field>
                <Field label="Numéro de permis" htmlFor="client-permit-number">
                  <Input
                    id="client-permit-number"
                    value={draft.permitNumber}
                    onChange={(event) =>
                      onChange("permitNumber", event.target.value)
                    }
                  />
                </Field>
                <Field label="Pièce d’identité" htmlFor="client-document-type">
                  <select
                    id="client-document-type"
                    value={draft.documentType}
                    onChange={(event) =>
                      onChange(
                        "documentType",
                        event.target
                          .value as ReservationClientDraft["documentType"],
                      )
                    }
                    className="input-shell appearance-none pr-10"
                  >
                    <option value="none">Aucune</option>
                    {RESERVATION_DOCUMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Référence du document"
                  htmlFor="client-document-number"
                  error={
                    saveAttempted ? validation.errors.documentNumber : undefined
                  }
                >
                  <Input
                    id="client-document-number"
                    value={draft.documentNumber}
                    onChange={(event) =>
                      onChange("documentNumber", event.target.value)
                    }
                    className={
                      validation.errors.documentNumber && saveAttempted
                        ? "border-error/35 focus-visible:ring-error/35"
                        : undefined
                    }
                  />
                </Field>
              </div>

              <Field label="Notes utiles" htmlFor="client-notes">
                <textarea
                  id="client-notes"
                  value={draft.notes}
                  onChange={(event) => onChange("notes", event.target.value)}
                  className="input-shell min-h-28 resize-y"
                />
              </Field>
            </div>
          </details>

          <div className="h-px bg-border/60" />

          <label
            id="client-consent"
            className={cn(
              "flex gap-3 rounded-card border p-4",
              validation.errors.consentDataUse && saveAttempted
                ? "border-error/35 bg-error/6"
                : "border-border/70 bg-surface/60",
            )}
            tabIndex={-1}
          >
            <input
              type="checkbox"
              checked={draft.consentDataUse}
              onChange={(event) =>
                onChange("consentDataUse", event.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
            />
            <span className="space-y-1 body-copy text-foreground/78">
              <span className="block font-semibold text-foreground">
                J’autorise l’usage de mes données pour préparer la réservation.
              </span>
              <span className="block text-muted-foreground">
                Elles servent uniquement à constituer le dossier et à ouvrir la
                suite du parcours.
              </span>
              {saveAttempted && validation.errors.consentDataUse ? (
                <span className="block text-error">
                  {validation.errors.consentDataUse}
                </span>
              ) : null}
            </span>
          </label>
        </div>

        <div className="border-t border-border/60 pt-6">
          <p className="text-sm text-muted-foreground">
            {lastSavedLabel ?? "Autosauvegarde"} ·{" "}
            {validation.requiredCompleteCount}/{validation.requiredCount} champs requis
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <Button
              as="button"
              type="submit"
              ariaLabel="Continuer vers la validation"
              variant="accent"
              size="lg"
              disabled={Boolean(permitCompatibilityMessage)}
            >
              Continuer
            </Button>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link
                href={backHref}
                className="font-semibold text-brand transition-colors hover:text-brand-strong"
              >
                Modifier la réservation
              </Link>
              <Link
                href="/conditions"
                className="font-semibold text-brand transition-colors hover:text-brand-strong"
              >
                Voir les conditions
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  help,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {help ? <p className="field-help">{help}</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
