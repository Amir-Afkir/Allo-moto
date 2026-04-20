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
  title: "Location moto Orléans",
  description:
    "Louez une moto à Orléans et partez sur les plus belles balades du Loiret : Loire, forêt d’Orléans, châteaux et sorties à la journée.",
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
