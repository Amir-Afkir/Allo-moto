import type { Metadata } from "next";
import { MotoCatalogClient } from "@/app/_features/catalog/components/MotoCatalogClient";
import { MotoCatalogHero } from "@/app/_features/catalog/components/MotoCatalogHero";
import { getPublicCatalogPageData } from "@/app/_features/ops/data/ops-store";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Catalogue motos | Allo Moto",
  description: "Comparez les motos premium à Orléans par permis, prix, dépôt et transmission.",
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
