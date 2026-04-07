import type { ReactNode } from "react";
import { Suspense } from "react";
import MobileStickyCTA from "@/app/_features/catalog/components/MobileStickyCTA";
import { getPublicMotorcycleBySlug } from "@/app/_features/ops/data/ops-store";

export default async function MotoDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const motorcycle = await getPublicMotorcycleBySlug(slug);

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <MobileStickyCTA
          motorcycleSlug={motorcycle?.slug ?? null}
          motorcycleLabel={
            motorcycle ? `${motorcycle.brand} ${motorcycle.name}` : null
          }
        />
      </Suspense>
    </>
  );
}
