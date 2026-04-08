import type { ReactNode } from "react";
import type { OpsVehicleRecord } from "@/app/_features/ops/data/ops-store";
import { saveVehicleAction } from "@/app/_features/ops/actions/ops-actions";
import { OpsVehicleImageField } from "@/app/_features/ops/components/OpsVehicleImageField";
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
      encType="multipart/form-data"
      className="space-y-6"
    >
      <input type="hidden" name="currentSlug" value={vehicle?.slug ?? ""} />

      {error === "save" ? (
        <div className="border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
          Les changements n&apos;ont pas pu etre enregistres. Verifiez les champs obligatoires.
        </div>
      ) : error === "image" ? (
        <div className="border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground/80">
          L&apos;image n&apos;a pas pu etre appliquee. Verifiez le fichier puis reenregistrez.
        </div>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold tracking-[0.12em] text-foreground/60 uppercase">
          Exploitation
        </legend>

        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="Marque">
            <input name="brand" defaultValue={vehicle?.brand ?? ""} className="input-shell" />
          </Field>
          <Field label="Nom commercial">
            <input name="name" defaultValue={vehicle?.name ?? ""} className="input-shell" />
          </Field>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Categorie">
            <select name="category" defaultValue={vehicle?.category ?? "scooter"} className="input-shell appearance-none pr-10">
              {MOTORCYCLE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transmission">
            <select name="transmission" defaultValue={vehicle?.transmission ?? "automatic"} className="input-shell appearance-none pr-10">
              {MOTORCYCLE_TRANSMISSION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Permis">
            <select name="licenseCategory" defaultValue={vehicle?.licenseCategory ?? "A1"} className="input-shell appearance-none pr-10">
              {MOTORCYCLE_LICENSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pilotage">
            <select name="opsStatus" defaultValue={vehicle?.opsStatus ?? "active"} className="input-shell appearance-none pr-10">
              <option value="active">Actif</option>
              <option value="hidden">Masque</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Prix / jour">
            <input name="priceFrom" type="number" min="0" defaultValue={vehicle?.priceFrom.amount ?? 0} className="input-shell" />
          </Field>
          <Field label="Depot">
            <input name="depositAmount" type="number" min="0" defaultValue={vehicle?.deposit.amount ?? 0} className="input-shell" />
          </Field>
          <Field label="Km inclus / jour">
            <input name="includedMileageKmPerDay" type="number" min="0" defaultValue={vehicle?.includedMileageKmPerDay ?? 0} className="input-shell" />
          </Field>
          <Field label="Retrait / localisation">
            <input name="locationLabel" defaultValue={vehicle?.locationLabel ?? ""} className="input-shell" />
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
          <Field label="Note courte">
            <input
              name="editorialNote"
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
        <Button
          as="button"
          type="submit"
          ariaLabel="Enregistrer le vehicule"
          variant="accent"
          size="lg"
        >
          Enregistrer
        </Button>
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
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
