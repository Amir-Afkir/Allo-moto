import MotoHero from "@/app/_features/catalog/components/MotoHero";
import MotoSelection from "@/app/_features/catalog/components/MotoSelection";
import { getFeaturedPublicMotorcycles } from "@/app/_features/ops/data/ops-store";
import MotoProcess from "@/app/_features/reservation/components/MotoProcess";
import MotoSupport from "@/app/_features/support/components/MotoSupport";

export const dynamic = "force-dynamic";

export default async function Page() {
  const motorcycles = await getFeaturedPublicMotorcycles(3);

  return (
    <main>
      <div className="-mt-[var(--chrome-offset)]">
        <MotoHero />
      </div>
      <MotoSelection motorcycles={motorcycles} />
      <MotoProcess />
      <MotoSupport />
    </main>
  );
}
