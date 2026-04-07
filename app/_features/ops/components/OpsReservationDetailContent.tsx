import { updateReservationStatusAction } from "@/app/_features/ops/actions/ops-actions";
import {
  type OpsReservationRecord,
  type OpsReservationStatus,
  type OpsVehicleBlockRecord,
  type OpsVehicleRecord,
} from "@/app/_features/ops/data/ops-store";
import { cn } from "@/app/_shared/lib/cn";
import { Button } from "@/app/_shared/ui/Button";

type OpsReservationDetailContentProps = {
  reservation: OpsReservationRecord;
  vehicle: OpsVehicleRecord | null;
  linkedBlocks: readonly OpsVehicleBlockRecord[];
  error?: string | null;
  mode?: "page" | "drawer";
};

export function OpsReservationDetailContent({
  reservation,
  vehicle,
  linkedBlocks,
  error = null,
  mode = "page",
}: OpsReservationDetailContentProps) {
  const facts = [
    {
      label: "Client",
      value: `${reservation.customerFirstName} ${reservation.customerLastName}`,
    },
    { label: "Email", value: reservation.customerEmail },
    { label: "Telephone", value: reservation.customerPhone },
    { label: "Contact prefere", value: reservation.customerPreferredContact },
    {
      label: "Moto",
      value: vehicle ? `${vehicle.brand} ${vehicle.name}` : reservation.vehicleSlug,
    },
    { label: "Retrait", value: reservation.pickupLocationLabel },
    { label: "Permis", value: reservation.permitType },
    { label: "Paiement", value: "Au retrait" },
    { label: "Location", value: `${reservation.estimatedTotal} EUR` },
    { label: "Depot", value: `${reservation.depositAmount} EUR` },
  ];

  if (mode === "drawer") {
    return (
      <div className="space-y-6">
        {error === "update" ? (
          <ErrorNotice />
        ) : null}

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {facts.map((fact) => (
              <Fact key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </div>

          {reservation.customerNotes ? (
            <div className="border-t border-border/60 pt-5">
              <p className="meta-label">Notes client</p>
              <p className="mt-3 body-copy text-foreground/80">
                {reservation.customerNotes}
              </p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/60 pt-5">
          <StockImpactBlock linkedBlocks={linkedBlocks} compact />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="section-band panel-space">
        {error === "update" ? <ErrorNotice /> : null}

        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2",
            error === "update" ? "mt-5" : "",
          )}
        >
          {facts.map((fact) => (
            <Fact key={fact.label} label={fact.label} value={fact.value} />
          ))}
        </div>

        {reservation.customerNotes ? (
          <div className="mt-6 border-t border-border/60 pt-6">
            <p className="meta-label">Notes client</p>
            <p className="mt-3 body-copy text-foreground/80">
              {reservation.customerNotes}
            </p>
          </div>
        ) : null}

        <OpsReservationActionBar
          reservationId={reservation.id}
          status={reservation.status}
        />
      </div>

      <div className="section-band panel-space">
        <StockImpactBlock linkedBlocks={linkedBlocks} />
      </div>
    </div>
  );
}

export function getReservationTone(status: OpsReservationStatus) {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
    default:
      return "warning";
  }
}

export function getReservationLabel(status: OpsReservationStatus) {
  switch (status) {
    case "pending":
      return "Demande";
    case "confirmed":
      return "Confirmee";
  }
}

export function OpsReservationActionBar({
  reservationId,
  status,
  successReturnTo,
  errorReturnTo,
  compact = false,
}: {
  reservationId: string;
  status: OpsReservationStatus;
  successReturnTo?: string;
  errorReturnTo?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn(compact ? "pt-0" : "mt-6 border-t border-border/60 pt-6")}>
      <p className="meta-label">Action admin</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {status === "pending" ? (
          <StatusForm
            reservationId={reservationId}
            nextStatus="confirmed"
            label="Confirmer"
            variant="accent"
            successReturnTo={successReturnTo}
            errorReturnTo={errorReturnTo}
          />
        ) : null}
        {status === "pending" ? (
          <StatusForm
            reservationId={reservationId}
            nextStatus="rejected"
            label="Refuser"
            variant="outline"
            successReturnTo={successReturnTo}
            errorReturnTo={errorReturnTo}
          />
        ) : null}
        {status === "confirmed" ? (
          <StatusForm
            reservationId={reservationId}
            nextStatus="cancelled"
            label="Annuler"
            variant="outline"
            successReturnTo={successReturnTo}
            errorReturnTo={errorReturnTo}
          />
        ) : null}
      </div>
      {status === "confirmed" ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Si vous annulez, la demande est supprimee et la moto redevient disponible.
        </p>
      ) : null}
    </div>
  );
}

function StockImpactBlock({
  linkedBlocks,
  compact = false,
}: {
  linkedBlocks: readonly OpsVehicleBlockRecord[];
  compact?: boolean;
}) {
  return (
    <>
      <p className={compact ? "meta-label" : "label"}>Impact stock</p>
      <h2 className={cn("text-foreground", compact ? "mt-2 text-lg font-semibold" : "mt-3 heading-3")}>
        Blocages lies
      </h2>

      <div className={cn(compact ? "mt-4 space-y-3" : "mt-5 space-y-3")}>
        {linkedBlocks.length > 0 ? (
          linkedBlocks.map((block) => (
            <div
              key={block.id}
              className="rounded-card border border-border/60 bg-surface/72 px-4 py-4"
            >
              <p className="meta-label">{block.type}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {block.startAt.slice(0, 10)} → {block.endAt.slice(0, 10)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{block.note}</p>
            </div>
          ))
        ) : (
          <p className="body-copy text-muted-foreground">
            Aucun blocage n&apos;est encore rattache a cette demande.
          </p>
        )}
      </div>
    </>
  );
}

function StatusForm({
  reservationId,
  nextStatus,
  label,
  variant,
  successReturnTo,
  errorReturnTo,
}: {
  reservationId: string;
  nextStatus: "confirmed" | "rejected" | "cancelled";
  label: string;
  variant: "accent" | "outline";
  successReturnTo?: string;
  errorReturnTo?: string;
}) {
  return (
    <form action={updateReservationStatusAction}>
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      {successReturnTo ? (
        <input type="hidden" name="successReturnTo" value={successReturnTo} />
      ) : null}
      {errorReturnTo ? (
        <input type="hidden" name="errorReturnTo" value={errorReturnTo} />
      ) : null}
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 border-b border-border/60 pb-3">
      <p className="meta-label">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ErrorNotice() {
  return (
    <div className="border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
      L&apos;action n&apos;a pas pu etre appliquee. Verifiez le creneau ou rechargez la page.
    </div>
  );
}
