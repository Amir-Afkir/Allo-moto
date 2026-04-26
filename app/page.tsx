import type { Metadata } from "next";
import MotoHero from "@/app/_features/catalog/components/MotoHero";
import MotoSelection from "@/app/_features/catalog/components/MotoSelection";
import MotoDestinations from "@/app/_features/destinations/components/MotoDestinations";
import { getPublicHomeData } from "@/app/_features/ops/data/ops-store";
import MotoFaq from "@/app/_features/readiness/components/MotoFaq";
import MotoReadiness from "@/app/_features/readiness/components/MotoReadiness";
import MotoProcess from "@/app/_features/reservation/components/MotoProcess";
import MotoSupport from "@/app/_features/support/components/MotoSupport";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Location moto à Orléans | Allo Moto",
  description:
    "Location moto à Orléans. Comparez les modèles, choisissez le créneau, puis partez vers la Loire, la forêt d’Orléans ou les châteaux.",
};

export default async function Page() {
  const { motorcycles } = await getPublicHomeData();

  return (
    <main>
      <div className="-mt-[var(--chrome-offset)]">
        <MotoHero />
      </div>
      <MotoSelection motorcycles={motorcycles} />
      <MotoDestinations />
      <MotoProcess />
      <MotoReadiness />
      <MotoSupport />
      <MotoFaq />
    </main>
  );
}
