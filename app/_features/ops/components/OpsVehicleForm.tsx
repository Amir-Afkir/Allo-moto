import type { ReactNode } from "react";
import type { OpsVehicleRecord } from "@/app/_features/ops/data/ops-store";
import { saveVehicleAction } from "@/app/_features/ops/actions/ops-actions";
import { OpsVehicleImageField } from "@/app/_features/ops/components/OpsVehicleImageField";
import { PendingSubmit } from "./PendingSubmit";
import { Button } from "@/app/_shared/ui/Button";
import { Label } from "@/app/_shared/ui/Label";
import {
  MOTORCYCLE_CATEGORY_OPTIONS,
  MOTORCYCLE_LICENSE_OPTIONS,
  MOTORCYCLE_TRANSMISSION_OPTIONS,
} from "@/app/_features/catalog/data/motorcycles";

export function OpsVehicleForm({
  vehicle,
  error,
  showBackLink = true,
}: {
  vehicle: OpsVehicleRecord | null;
  error?: string | null;
  showBackLink?: boolean;
}) {
  return (
    <form
      action={saveVehicleAction}
      className="space-y-6"
    >
      <input type="hidden" name="currentSlug" value={vehicle?.slug ?? ""} />

      {error === "save" ? (
        <div role="alert" className="border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
          Les changements n&apos;ont pas pu etre enregistres. Verifiez les champs obligatoires.
        </div>
      ) : error === "image" ? (
        <div role="alert" className="border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
          L&apos;image n&apos;a pas pu etre appliquee. Utilisez une photo JPEG, PNG, WebP ou AVIF de 4 Mo maximum puis reenregistrez.
        </div>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold tracking-[0.12em] text-foreground/60 uppercase">
          Exploitation
        </legend>

        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="Marque" htmlFor="ops-vehicle-brand">
            <input id="ops-vehicle-brand" name="brand" required maxLength={120} defaultValue={vehicle?.brand ?? ""} className="input-shell" />
          </Field>
          <Field label="Nom commercial" htmlFor="ops-vehicle-name">
            <input id="ops-vehicle-name" name="name" required maxLength={120} defaultValue={vehicle?.name ?? ""} className="input-shell" />
          </Field>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Categorie" htmlFor="ops-vehicle-category">
            <select id="ops-vehicle-category" name="category" defaultValue={vehicle?.category ?? "scooter"} className="input-shell appearance-none pr-10">
              {MOTORCYCLE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transmission" htmlFor="ops-vehicle-transmission">
            <select id="ops-vehicle-transmission" name="transmission" defaultValue={vehicle?.transmission ?? "automatic"} className="input-shell appearance-none pr-10">
              {MOTORCYCLE_TRANSMISSION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Permis" htmlFor="ops-vehicle-licenseCategory">
            <select id="ops-vehicle-licenseCategory" name="licenseCategory" defaultValue={vehicle?.licenseCategory ?? "A1"} className="input-shell appearance-none pr-10">
              {MOTORCYCLE_LICENSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pilotage" htmlFor="ops-vehicle-opsStatus">
            <select id="ops-vehicle-opsStatus" name="opsStatus" defaultValue={vehicle?.opsStatus ?? "active"} className="input-shell appearance-none pr-10">
              <option value="active">Actif</option>
              <option value="hidden">Masque</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Prix / jour" htmlFor="ops-vehicle-priceFrom">
            <input id="ops-vehicle-priceFrom" name="priceFrom" type="number" required min="0" max="1000000" step="1" defaultValue={vehicle?.priceFrom.amount ?? 0} className="input-shell" />
          </Field>
          <Field label="Depot" htmlFor="ops-vehicle-depositAmount">
            <input id="ops-vehicle-depositAmount" name="depositAmount" type="number" required min="0" max="1000000" step="1" defaultValue={vehicle?.deposit.amount ?? 0} className="input-shell" />
          </Field>
          <Field label="Km inclus / jour" htmlFor="ops-vehicle-includedMileageKmPerDay">
            <input id="ops-vehicle-includedMileageKmPerDay" name="includedMileageKmPerDay" type="number" required min="0" max="1000000" step="1" defaultValue={vehicle?.includedMileageKmPerDay ?? 0} className="input-shell" />
          </Field>
          <Field label="Retrait / localisation" htmlFor="ops-vehicle-locationLabel">
            <input id="ops-vehicle-locationLabel" name="locationLabel" required maxLength={200} defaultValue={vehicle?.locationLabel ?? ""} className="input-shell" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-border/60 pt-5">
        <legend className="text-sm font-semibold tracking-[0.12em] text-foreground/60 uppercase">
          Publication
        </legend>

        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Image principale">
            <OpsVehicleImageField
              initialValue={vehicle?.primaryImage ?? ""}
              vehicleLabel={`${vehicle?.brand ?? ""} ${vehicle?.name ?? ""}`.trim() || "Vehicule"}
            />
          </Field>
          <Field label="Note courte" htmlFor="ops-vehicle-editorialNote">
            <input
              id="ops-vehicle-editorialNote" name="editorialNote" maxLength={500}
              defaultValue={vehicle?.editorialNote ?? ""}
              className="input-shell"
            />
          </Field>
        </div>

        <label className="flex items-center gap-3 text-sm text-foreground/78">
          <input type="checkbox" name="featured" defaultChecked={vehicle?.featured ?? false} />
          Mettre en avant ce vehicule sur l&apos;accueil.
        </label>
      </fieldset>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <PendingSubmit />
        {showBackLink ? (
          <Button
            as="link"
            href="/ops/fleet"
            ariaLabel="Revenir a la flotte"
            variant="outline"
            size="lg"
          >
            Retour flotte
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
