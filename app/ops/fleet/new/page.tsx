import type { Metadata } from "next";
import { OpsVehicleForm } from "@/app/_features/ops/components/OpsVehicleForm";
import { requireAdminSession } from "@/app/_features/ops/lib/auth";
import { OpsShell } from "@/app/_features/ops/components/OpsShell";
import Section from "@/app/_shared/components/Section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nouveau vehicule",
  description: "Ajout d'un vehicule de location.",
};

export default async function OpsFleetNewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();
  const resolvedSearchParams = await searchParams;
  const error =
    (Array.isArray(resolvedSearchParams?.error)
      ? resolvedSearchParams?.error[0]
      : resolvedSearchParams?.error) ?? null;

  return (
    <OpsShell
      current="fleet"
      title="Ajouter un vehicule."
      subtitle="Renseignez l'essentiel, puis enregistrez le vehicule."
    >
      <Section className="pt-0" density="compact">
        <div className="border-y border-border/60 py-5">
          <OpsVehicleForm vehicle={null} error={error} />
        </div>
      </Section>
    </OpsShell>
  );
}
