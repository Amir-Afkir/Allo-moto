import Link from "next/link";
import type { Metadata } from "next";
import { updateVehicleOpsStatusAction } from "@/app/_features/ops/actions/ops-actions";
import {
  getAdminReservationById,
  getOpsActionSummary,
  listAdminVehicles,
  type AdminVehicleRow,
} from "@/app/_features/ops/data/ops-store";
import {
  getOpsStatusLabel,
  getOpsStatusTone,
  getPublicStatusLabel,
  getPublicStatusTone,
} from "@/app/_features/ops/lib/presentation";
import {
  getReservationLabel,
  OpsReservationActionBar,
  getReservationTone,
  OpsReservationDetailContent,
} from "@/app/_features/ops/components/OpsReservationDetailContent";
import { OpsReservationDrawer } from "@/app/_features/ops/components/OpsReservationDrawer";
import { requireAdminSession } from "@/app/_features/ops/lib/auth";
import { OpsShell } from "@/app/_features/ops/components/OpsShell";
import { Badge } from "@/app/_shared/ui/Badge";
import { Button } from "@/app/_shared/ui/Button";
import Section from "@/app/_shared/components/Section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flotte admin",
  description: "Gestion simple des vehicules Allo Moto.",
};

type FleetView = "all" | "needs-action" | "maintenance" | "hidden";

export default async function OpsFleetPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();

  const resolvedSearchParams = await searchParams;
  const view = parseFleetView(firstValue(resolvedSearchParams?.view));
  const openReservationId = firstValue(resolvedSearchParams?.open) ?? "";
  const error = firstValue(resolvedSearchParams?.error) ?? null;
  const currentHref = buildFleetHref({ view });
  const openHref = openReservationId
    ? buildFleetHref({ view, open: openReservationId })
    : currentHref;

  const [vehicles, summary, openReservation] = await Promise.all([
    listAdminVehicles(),
    getOpsActionSummary(),
    openReservationId ? getAdminReservationById(openReservationId) : Promise.resolve(null),
  ]);

  const sortedVehicles = [...vehicles].sort(compareVehicles);
  const visibleVehicles = sortedVehicles.filter((vehicle) =>
    matchesFleetView(vehicle, view),
  );

  return (
    <OpsShell
      current="fleet"
      title="Flotte."
      subtitle="Pilotez la flotte, traitez les demandes utiles et gardez le site a jour."
      actions={
        <Button
          as="link"
          href="/ops/fleet/new"
          ariaLabel="Ajouter un vehicule"
          variant="accent"
          size="md"
        >
          Ajouter un vehicule
        </Button>
      }
    >
      <Section className="pt-0" density="compact">
        <div className="flex flex-wrap gap-2 border-y border-border/60 py-4">
          <AlertPill
            href="/ops/reservations?status=pending"
            label="Demandes en attente"
            count={summary.pendingReservations}
            active={view === "needs-action"}
          />
          <AlertPill
            href="/ops/reservations?focus=pickup-today"
            label="Departs aujourd'hui"
            count={summary.pickupsToday}
          />
          <AlertPill
            href="/ops/reservations?focus=return-today"
            label="Retours aujourd'hui"
            count={summary.returnsToday}
          />
          <AlertPill
            href="/ops/fleet?view=maintenance"
            label="Maintenance"
            count={summary.maintenanceVehicles}
            active={view === "maintenance"}
          />
          {(view === "maintenance" || view === "hidden" || view === "needs-action") ? (
            <AlertPill href="/ops/fleet" label="Tout voir" count={sortedVehicles.length} />
          ) : null}
        </div>
      </Section>

      <Section
        title={getFleetSectionTitle(view)}
        subtitle={getFleetSectionSubtitle(view)}
        className="pt-0"
        density="compact"
      >
        <div className="border-y border-border/60">
          <div className="divide-y divide-border/60">
            {visibleVehicles.length > 0 ? (
              visibleVehicles.map((entry) => (
                <VehicleRow
                  key={entry.vehicle.id}
                  entry={entry}
                  view={view}
                  openReservationId={openReservationId}
                />
              ))
            ) : (
              <div className="py-6">
                <p className="body-copy text-muted-foreground">
                  Aucun vehicule ne correspond a cette vue.
                </p>
              </div>
            )}
          </div>
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

function VehicleRow({
  entry,
  view,
  openReservationId,
}: {
  entry: AdminVehicleRow;
  view: FleetView;
  openReservationId: string;
}) {
  const { vehicle, publicMotorcycle } = entry;
  const pendingCount = entry.pendingReservations.length;
  const demandHref =
    pendingCount > 1
      ? `/ops/reservations?status=pending&vehicle=${vehicle.slug}`
      : entry.primaryDemandId
        ? buildFleetHref({ view, open: entry.primaryDemandId })
        : null;
  const isOpen = entry.pendingReservations.some(
    (reservation) => reservation.id === openReservationId,
  );

  return (
    <div
      className={`grid gap-4 px-3 py-5 transition-colors lg:grid-cols-[minmax(0,1.1fr)_minmax(12rem,0.8fr)_auto] lg:items-center ${
        isOpen ? "bg-brand-soft/8" : ""
      }`}
    >
      <div className="space-y-2">
        <div className="space-y-1">
          <p className="meta-label">{vehicle.brand}</p>
          <p className="text-base font-semibold text-foreground">
            {vehicle.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {vehicle.locationLabel} • {vehicle.licenseCategory} • {vehicle.transmission}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getPublicStatusTone(publicMotorcycle.status)}>
            {getPublicStatusLabel(publicMotorcycle.status)}
          </Badge>
          <Badge variant={getOpsStatusTone(vehicle.opsStatus)}>
            {getOpsStatusLabel(vehicle.opsStatus)}
          </Badge>
          {pendingCount > 0 ? (
            <Badge variant="warning">
              {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <p className="meta-label">Prochaine action</p>
        <p className="text-sm font-medium text-foreground/82">
          {entry.nextActionLabel}
        </p>
        {demandHref ? (
          <Link
            href={demandHref}
            className="inline-flex text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            {pendingCount > 1 ? "Voir les demandes" : "Voir la demande"}
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <Button
          as="link"
          href={`/ops/fleet/${vehicle.slug}`}
          ariaLabel={`Ouvrir ${vehicle.name}`}
          variant="outline"
          size="md"
        >
          Voir
        </Button>
        <Button
          as="link"
          href={`/ops/fleet/${vehicle.slug}#disponibilites`}
          ariaLabel={`Bloquer des dates pour ${vehicle.name}`}
          variant="outline"
          size="md"
        >
          Bloquer
        </Button>
        <form action={updateVehicleOpsStatusAction}>
          <input type="hidden" name="vehicleSlug" value={vehicle.slug} />
          <input
            type="hidden"
            name="nextStatus"
            value={vehicle.opsStatus === "hidden" ? "active" : "hidden"}
          />
          <input type="hidden" name="returnTo" value="/ops/fleet" />
          <button
            type="submit"
            className="rounded-pill border border-border/60 bg-surface/72 px-4 py-2 text-sm font-semibold text-foreground/74 transition-colors hover:bg-surface hover:text-foreground"
          >
            {vehicle.opsStatus === "hidden" ? "Reactiver" : "Masquer"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AlertPill({
  href,
  label,
  count,
  active = false,
}: {
  href: string;
  label: string;
  count: number;
  active?: boolean;
}) {
  const baseClassName = active
    ? "border-brand/20 bg-brand-soft text-brand-strong"
    : count > 0
      ? "border-border/60 bg-surface/72 text-foreground/82 hover:bg-surface"
      : "border-border/50 bg-surface/40 text-muted-foreground";

  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-pill border px-4 py-2 text-sm font-semibold transition-colors ${baseClassName}`}
    >
      <span>{label}</span>
      <span className="ml-2">{count}</span>
    </Link>
  );
}

function parseFleetView(value: string | undefined): FleetView {
  if (
    value === "needs-action" ||
    value === "maintenance" ||
    value === "hidden"
  ) {
    return value;
  }

  return "all";
}

function matchesFleetView(entry: AdminVehicleRow, view: FleetView) {
  if (view === "maintenance") {
    return (
      entry.vehicle.opsStatus === "maintenance" ||
      entry.publicMotorcycle.status === "maintenance"
    );
  }

  if (view === "hidden") {
    return entry.vehicle.opsStatus === "hidden";
  }

  if (view === "needs-action") {
    return (
      entry.pendingReservations.length > 0 ||
      entry.todayPickupCount > 0 ||
      entry.todayReturnCount > 0
    );
  }

  return true;
}

function compareVehicles(left: AdminVehicleRow, right: AdminVehicleRow) {
  const leftRank = getVehiclePriority(left);
  const rightRank = getVehiclePriority(right);

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const leftDate = left.nextConfirmedReservation?.pickupAt ?? "";
  const rightDate = right.nextConfirmedReservation?.pickupAt ?? "";
  if (leftDate && rightDate && leftDate !== rightDate) {
    return leftDate.localeCompare(rightDate);
  }

  return `${left.vehicle.brand} ${left.vehicle.name}`.localeCompare(
    `${right.vehicle.brand} ${right.vehicle.name}`,
    "fr",
  );
}

function getVehiclePriority(entry: AdminVehicleRow) {
  if (entry.pendingReservations.length > 0) return 0;
  if (entry.todayPickupCount > 0) return 1;
  if (entry.todayReturnCount > 0) return 2;
  if (entry.vehicle.opsStatus === "active") return 3;
  if (entry.vehicle.opsStatus === "maintenance") return 4;
  return 5;
}

function getFleetSectionTitle(view: FleetView) {
  switch (view) {
    case "needs-action":
      return "Vehicules a traiter";
    case "maintenance":
      return "Vehicules en maintenance";
    case "hidden":
      return "Vehicules masques";
    case "all":
    default:
      return "Flotte";
  }
}

function getFleetSectionSubtitle(view: FleetView) {
  switch (view) {
    case "needs-action":
      return "Demandes en attente, departs et retours du jour d'abord.";
    case "maintenance":
      return "Les vehicules indisponibles pour maintenance.";
    case "hidden":
      return "Les vehicules retires du catalogue public.";
    case "all":
    default:
      return "Une ligne, une lecture, les actions utiles sans detour.";
  }
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildFleetHref({
  view,
  open,
}: {
  view: FleetView;
  open?: string;
}) {
  const params = new URLSearchParams();
  if (view !== "all") {
    params.set("view", view);
  }
  if (open) {
    params.set("open", open);
  }

  const queryString = params.toString();
  return queryString ? `/ops/fleet?${queryString}` : "/ops/fleet";
}
