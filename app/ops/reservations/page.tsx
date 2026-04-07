import Link from "next/link";
import type { Metadata } from "next";
import {
  getAdminReservationById,
  listAdminReservations,
  type OpsReservationFocus,
  type OpsReservationStatus,
} from "@/app/_features/ops/data/ops-store";
import { requireAdminSession } from "@/app/_features/ops/lib/auth";
import { updateReservationStatusAction } from "@/app/_features/ops/actions/ops-actions";
import {
  getReservationLabel,
  OpsReservationActionBar,
  getReservationTone,
  OpsReservationDetailContent,
} from "@/app/_features/ops/components/OpsReservationDetailContent";
import { OpsReservationDrawer } from "@/app/_features/ops/components/OpsReservationDrawer";
import { OpsShell } from "@/app/_features/ops/components/OpsShell";
import { Badge } from "@/app/_shared/ui/Badge";
import { Button } from "@/app/_shared/ui/Button";
import Section from "@/app/_shared/components/Section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes admin",
  description: "Demandes clients et confirmations Allo Moto.",
};

const STATUS_OPTIONS: ReadonlyArray<{
  value: OpsReservationStatus | "all";
  label: string;
}> = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmees" },
] as const;

export default async function OpsReservationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();

  const resolvedSearchParams = await searchParams;
  const status = firstValue(resolvedSearchParams?.status) ?? "all";
  const query = firstValue(resolvedSearchParams?.q) ?? "";
  const vehicleSlug = firstValue(resolvedSearchParams?.vehicle) ?? "";
  const focus = parseFocus(firstValue(resolvedSearchParams?.focus));
  const openReservationId = firstValue(resolvedSearchParams?.open) ?? "";
  const error = firstValue(resolvedSearchParams?.error) ?? null;
  const effectiveStatus = isStatus(status) ? status : "all";
  const effectiveFocus = effectiveStatus === "pending" ? null : focus;
  const currentHref = buildReservationsHref({
    status: effectiveStatus,
    query,
    focus: effectiveFocus,
    vehicleSlug,
  });
  const openHref = openReservationId
    ? buildReservationsHref({
        status: effectiveStatus,
        query,
        focus: effectiveFocus,
        vehicleSlug,
        open: openReservationId,
      })
    : currentHref;
  const [reservations, openReservation] = await Promise.all([
    listAdminReservations({
      status: effectiveStatus,
      query,
      focus: effectiveFocus,
      vehicleSlug: vehicleSlug || null,
    }),
    openReservationId ? getAdminReservationById(openReservationId) : Promise.resolve(null),
  ]);

  return (
    <OpsShell
      current="reservations"
      title="Demandes."
      subtitle="Confirmez ou liberez les demandes ouvertes sans detour."
    >
      <Section
        title="Filtres"
        subtitle={getFilterSubtitle(effectiveFocus, vehicleSlug)}
        className="pt-0"
        density="compact"
      >
        <div className="border-y border-border/60 py-4">
          <form className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={buildReservationsHref({
                    status: option.value,
                    query,
                    focus: option.value === "pending" ? null : effectiveFocus,
                    vehicleSlug,
                  })}
                  className={`rounded-pill border px-4 py-2 text-sm font-semibold transition-colors ${
                    effectiveStatus === option.value
                      ? "border-brand/20 bg-brand-soft text-brand-strong"
                      : "border-border/60 bg-surface/72 text-foreground/74 hover:bg-surface"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Client, email, reference, date..."
                className="input-shell min-w-[16rem]"
              />
              <input type="hidden" name="status" value={effectiveStatus} />
              {effectiveFocus ? <input type="hidden" name="focus" value={effectiveFocus} /> : null}
              {vehicleSlug ? <input type="hidden" name="vehicle" value={vehicleSlug} /> : null}
              <button
                type="submit"
                className="rounded-pill border border-border/60 bg-surface/72 px-4 py-2 text-sm font-semibold text-foreground/74"
              >
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </Section>

      <Section
        title="Demandes ouvertes"
        subtitle="Qui, quoi, quand, puis l'action a prendre."
        className="pt-0"
        density="compact"
      >
        <div className="border-y border-border/60">
          {reservations.length > 0 ? (
            <div className="divide-y divide-border/60">
              {reservations.map(({ reservation, vehicle }) => (
                <div
                  key={reservation.id}
                  className={`grid gap-4 px-3 py-5 transition-colors lg:grid-cols-[minmax(0,1.05fr)_minmax(13rem,0.7fr)_auto] lg:items-center ${
                    openReservationId === reservation.id ? "bg-brand-soft/8" : ""
                  }`}
                >
                  <Link
                    href={buildReservationsHref({
                      status: effectiveStatus,
                      query,
                      focus: effectiveFocus,
                      vehicleSlug,
                      open: reservation.id,
                    })}
                    className="block space-y-2 rounded-card transition-colors hover:bg-surface/42"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getReservationTone(reservation.status)}>
                        {getReservationLabel(reservation.status)}
                      </Badge>
                      <Badge variant="outline">
                        {reservation.pickupDate} → {reservation.returnDate}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        {reservation.customerFirstName} {reservation.customerLastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle ? `${vehicle.brand} ${vehicle.name}` : reservation.vehicleSlug}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.customerEmail} • {reservation.pickupLocationLabel}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href={buildReservationsHref({
                      status: effectiveStatus,
                      query,
                      focus: effectiveFocus,
                      vehicleSlug,
                      open: reservation.id,
                    })}
                    className="block space-y-1 rounded-card transition-colors hover:bg-surface/42"
                  >
                    <p className="meta-label">Maintenant</p>
                    <p className="text-sm font-medium text-foreground/82">
                      {getReservationActionLabel(reservation.status)}
                    </p>
                    <span className="inline-flex text-sm font-semibold text-brand transition-colors hover:text-brand-strong">
                      Voir la demande
                    </span>
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {reservation.status === "pending" ? (
                      <>
                        <StatusInlineForm
                          reservationId={reservation.id}
                          nextStatus="confirmed"
                          label="Confirmer"
                          variant="accent"
                          returnTo={currentHref}
                        />
                        <StatusInlineForm
                          reservationId={reservation.id}
                          nextStatus="rejected"
                          label="Refuser"
                          variant="outline"
                          returnTo={currentHref}
                        />
                      </>
                    ) : null}
                    {reservation.status === "confirmed" ? (
                      <StatusInlineForm
                        reservationId={reservation.id}
                        nextStatus="cancelled"
                        label="Annuler"
                        variant="outline"
                        returnTo={currentHref}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6">
              <p className="body-copy text-muted-foreground">
                Aucune demande ne correspond a ce filtre.
              </p>
            </div>
          )}
        </div>
      </Section>

      {openReservation ? (
        <OpsReservationDrawer
          closeHref={currentHref}
          title={openReservation.reservation.reference}
          statusLabel={getReservationLabel(openReservation.reservation.status)}
          statusTone={getReservationTone(openReservation.reservation.status)}
          periodLabel={`${openReservation.reservation.pickupDate} → ${openReservation.reservation.returnDate}`}
          footer={
            <OpsReservationActionBar
              reservationId={openReservation.reservation.id}
              status={openReservation.reservation.status}
              successReturnTo={currentHref}
              errorReturnTo={openHref}
              compact
            />
          }
        >
          <OpsReservationDetailContent
            reservation={openReservation.reservation}
            vehicle={openReservation.vehicle}
            linkedBlocks={openReservation.linkedBlocks}
            error={error}
            mode="drawer"
          />
        </OpsReservationDrawer>
      ) : null}
    </OpsShell>
  );
}

function StatusInlineForm({
  reservationId,
  nextStatus,
  label,
  variant,
  returnTo,
}: {
  reservationId: string;
  nextStatus: "confirmed" | "rejected" | "cancelled";
  label: string;
  variant: "accent" | "outline";
  returnTo: string;
}) {
  return (
    <form action={updateReservationStatusAction}>
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Button
        as="button"
        type="submit"
        ariaLabel={label}
        variant={variant}
        size="md"
      >
        {label}
      </Button>
    </form>
  );
}

function buildReservationsHref({
  status,
  query,
  focus,
  vehicleSlug,
  open,
}: {
  status: OpsReservationStatus | "all";
  query?: string;
  focus?: OpsReservationFocus | null;
  vehicleSlug?: string;
  open?: string;
}) {
  const params = new URLSearchParams();
  if (status && status !== "all") {
    params.set("status", status);
  }
  if (query) {
    params.set("q", query);
  }
  if (focus) {
    params.set("focus", focus);
  }
  if (vehicleSlug) {
    params.set("vehicle", vehicleSlug);
  }
  if (open) {
    params.set("open", open);
  }

  const queryString = params.toString();
  return queryString ? `/ops/reservations?${queryString}` : "/ops/reservations";
}

function parseFocus(value: string | undefined): OpsReservationFocus | null {
  if (value === "pickup-today" || value === "return-today") {
    return value;
  }

  return null;
}

function getFilterSubtitle(focus: OpsReservationFocus | null, vehicleSlug: string) {
  if (focus === "pickup-today") {
    return "Demandes confirmees avec depart aujourd'hui.";
  }

  if (focus === "return-today") {
    return "Demandes confirmees avec retour aujourd'hui.";
  }

  if (vehicleSlug) {
    return `Demandes ouvertes pour ${vehicleSlug}.`;
  }

  return "Cherchez une demande par statut, client, reference ou date.";
}

function getReservationActionLabel(status: OpsReservationStatus) {
  return status === "confirmed"
    ? "Creneau confirme, la moto est bloquee."
    : "Confirmer ou liberer la moto.";
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isStatus(value: string): value is OpsReservationStatus | "all" {
  return ["all", "pending", "confirmed"].includes(value);
}
