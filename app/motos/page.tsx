import type { Metadata } from "next";
import { MotoCatalogClient } from "@/app/_features/catalog/components/MotoCatalogClient";
import { MotoCatalogHero } from "@/app/_features/catalog/components/MotoCatalogHero";
import { getPublicCatalogPageData } from "@/app/_features/ops/data/ops-store";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Motos à Orléans | Allo Moto",
  description:
    "Comparez les motos à Orléans par créneau, permis et budget avant de réserver.",
};

export default async function MotosPage() {
  const { motorcycles, planning } = await getPublicCatalogPageData();

  return (
    <main className="app-shell">
      <MotoCatalogHero />
      <MotoCatalogClient
        motorcycles={motorcycles}
        initialPlanningReservations={planning.reservations}
        initialPlanningBlocks={planning.blocks}
      />
    </main>
  );
}
