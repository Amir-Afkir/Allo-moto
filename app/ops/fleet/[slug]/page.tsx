import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  addVehicleBlockAction,
  deleteVehicleAction,
  deleteVehicleBlockAction,
  updateVehicleOpsStatusAction,
} from "@/app/_features/ops/actions/ops-actions";
import {
  getAdminVehicleBySlug,
  type OpsVehicleBlockRecord,
} from "@/app/_features/ops/data/ops-store";
import {
  getBlockLabel,
  getBlockTone,
  getOpsStatusLabel,
  getOpsStatusTone,
  getPublicStatusLabel,
  getPublicStatusTone,
} from "@/app/_features/ops/lib/presentation";
import { requireAdminSession } from "@/app/_features/ops/lib/auth";
import { OpsVehicleForm } from "@/app/_features/ops/components/OpsVehicleForm";
import { OpsShell } from "@/app/_features/ops/components/OpsShell";
import { Button } from "@/app/_shared/ui/Button";
import { Badge } from "@/app/_shared/ui/Badge";
import { Label } from "@/app/_shared/ui/Label";
import Section from "@/app/_shared/components/Section";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Flotte ${slug}`,
    description: "Edition simple d'un vehicule de location.",
  };
}

export default async function OpsFleetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();

  const { slug } = await params;
  const vehicleEntry = await getAdminVehicleBySlug(slug);
  if (!vehicleEntry) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const error =
    (Array.isArray(resolvedSearchParams?.error)
      ? resolvedSearchParams?.error[0]
      : resolvedSearchParams?.error) ?? null;

  const openReservations = vehicleEntry.reservations.filter(
    (reservation) =>
      reservation.status === "pending" || reservation.status === "confirmed",
  );

  return (
    <OpsShell
      current="fleet"
      title={`${vehicleEntry.vehicle.brand} ${vehicleEntry.vehicle.name}`}
      subtitle="Modifiez, bloquez, masquez ou supprimez depuis la meme page."
      meta={
        <>
          <Badge variant={getPublicStatusTone(vehicleEntry.publicMotorcycle.status)}>
            {getPublicStatusLabel(vehicleEntry.publicMotorcycle.status)}
          </Badge>
          <Badge variant={getOpsStatusTone(vehicleEntry.vehicle.opsStatus)}>
            {getOpsStatusLabel(vehicleEntry.vehicle.opsStatus)}
          </Badge>
          {openReservations.length > 0 ? (
            <Badge variant="warning">
              {openReservations.length} demande{openReservations.length > 1 ? "s" : ""} ouverte{openReservations.length > 1 ? "s" : ""}
            </Badge>
          ) : null}
        </>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            as="link"
            href="/ops/fleet"
            ariaLabel="Retourner a la flotte"
            variant="outline"
            size="md"
          >
            Retour flotte
          </Button>
          <Button
            as="link"
            href={`#disponibilites`}
            ariaLabel="Aller aux disponibilites"
            variant="outline"
            size="md"
          >
            Disponibilites
          </Button>
          <form action={updateVehicleOpsStatusAction}>
            <input type="hidden" name="vehicleSlug" value={vehicleEntry.vehicle.slug} />
            <input
              type="hidden"
              name="nextStatus"
              value={vehicleEntry.vehicle.opsStatus === "hidden" ? "active" : "hidden"}
            />
            <input type="hidden" name="returnTo" value={`/ops/fleet/${vehicleEntry.vehicle.slug}`} />
            <button
              type="submit"
              className="rounded-pill border border-border/60 bg-surface/72 px-4 py-2 text-sm font-semibold text-foreground/74 transition-colors hover:bg-surface hover:text-foreground"
            >
              {vehicleEntry.vehicle.opsStatus === "hidden" ? "Reactiver" : "Masquer"}
            </button>
          </form>
        </div>
      }
    >
      <Section
        title="Modifier"
        subtitle="Renseignez l'essentiel pour exploiter et publier ce vehicule."
        className="pt-0"
        density="compact"
      >
        {error === "save" ? (
          <div className="mb-4 border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
            Les changements n&apos;ont pas pu etre enregistres.
          </div>
        ) : null}

        <div className="border-y border-border/60 py-5">
          <OpsVehicleForm vehicle={vehicleEntry.vehicle} showBackLink={false} />
        </div>
      </Section>

      <Section
        id="disponibilites"
        title="Disponibilites"
        subtitle="Ajoutez un blocage ou retirez un blocage manuel sans quitter la fiche."
        className="pt-0"
        density="compact"
      >
        <div className="grid gap-6 border-y border-border/60 py-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="space-y-4">
            {vehicleEntry.blocks.length > 0 ? (
              vehicleEntry.blocks.map((block) => (
                <BlockRow
                  key={block.id}
                  block={block}
                  vehicleSlug={vehicleEntry.vehicle.slug}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun blocage enregistre.
              </p>
            )}
          </div>

          <div className="space-y-3.5">
            {error === "block" ? (
              <div className="border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
                Le blocage n&apos;a pas pu etre ajoute.
              </div>
            ) : null}

            <form action={addVehicleBlockAction} className="space-y-3.5">
              <input type="hidden" name="vehicleSlug" value={vehicleEntry.vehicle.slug} />
              <input type="hidden" name="returnTo" value={`/ops/fleet/${vehicleEntry.vehicle.slug}#disponibilites`} />

              <div className="space-y-2">
                <Label htmlFor="block-type">Type</Label>
                <select
                  id="block-type"
                  name="type"
                  defaultValue="manual_block"
                  className="input-shell appearance-none pr-10"
                >
                  <option value="manual_block">Blocage manuel</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="block-start">Debut</Label>
                  <input id="block-start" name="startDate" type="date" className="input-shell" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-end">Fin</Label>
                  <input id="block-end" name="endDate" type="date" className="input-shell" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="block-note">Note</Label>
                <textarea id="block-note" name="note" className="input-shell min-h-24" />
              </div>

              <Button
                as="button"
                type="submit"
                ariaLabel="Ajouter un blocage"
                variant="accent"
                size="md"
              >
                Ajouter un blocage
              </Button>
            </form>
          </div>
        </div>
      </Section>

      <Section
        title="Supprimer"
        subtitle="Supprimez ce vehicule seulement si aucune demande en attente ou confirmee n'existe."
        className="pt-0"
        density="compact"
      >
        {error === "delete" ? (
          <div className="mb-4 border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
            Impossible de supprimer ce vehicule tant qu&apos;une demande en attente ou confirmee existe encore.
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-y border-border/60 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-foreground/78">
              La suppression retire le vehicule de la flotte et efface ses blocages manuels.
            </p>
            {openReservations.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Traitez d&apos;abord les demandes ouvertes dans les reservations.
              </p>
            ) : null}
          </div>

          <form action={deleteVehicleAction}>
            <input type="hidden" name="vehicleSlug" value={vehicleEntry.vehicle.slug} />
            <Button
              as="button"
              type="submit"
              ariaLabel="Supprimer ce vehicule"
              variant="outline"
              size="md"
              className="border-error/20 text-error hover:bg-error/8"
            >
              Supprimer le vehicule
            </Button>
          </form>
        </div>
      </Section>
    </OpsShell>
  );
}

function BlockRow({
  block,
  vehicleSlug,
}: {
  block: OpsVehicleBlockRecord;
  vehicleSlug: string;
}) {
  const removable = !block.reservationId;

  return (
    <div className="border-t border-border/60 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getBlockTone(block.type)}>
              {getBlockLabel(block.type)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDateRange(block.startAt, block.endAt)}
            </span>
          </div>
          <p className="text-sm text-foreground/80">{block.note}</p>
        </div>

        {removable ? (
          <form action={deleteVehicleBlockAction}>
            <input type="hidden" name="vehicleSlug" value={vehicleSlug} />
            <input type="hidden" name="blockId" value={block.id} />
            <input type="hidden" name="returnTo" value={`/ops/fleet/${vehicleSlug}#disponibilites`} />
            <Button
              as="button"
              type="submit"
              ariaLabel="Supprimer ce blocage"
              variant="outline"
              size="md"
            >
              Supprimer
            </Button>
          </form>
        ) : (
          <Badge variant="outline">Lie a une reservation</Badge>
        )}
      </div>
    </div>
  );
}


function formatDateRange(startAt: string, endAt: string) {
  return `${startAt.slice(0, 10)} → ${endAt.slice(0, 10)}`;
}
