import type { ReactNode } from "react";
import { Badge } from "@/app/_shared/ui/Badge";
import { Button } from "@/app/_shared/ui/Button";
import type { CatalogMotorcycle } from "@/app/_features/catalog/data/motorcycles";
import { SelectedMotorcycleCard } from "./SelectedMotorcycleCard";

export function MotoRetenueSidebar({
  motorcycle,
  selectedVisible,
  primaryActionLabel = "Réserver",
  primaryActionHref,
  primaryActionAriaLabel,
  contextLabel,
  details,
  footerNote,
}: {
  motorcycle: CatalogMotorcycle;
  selectedVisible: boolean;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  primaryActionAriaLabel?: string;
  contextLabel?: string | null;
  details?: ReactNode;
  footerNote?: ReactNode;
}) {
  const recommendation = getRecommendationLabel(motorcycle.category, motorcycle.transmission);
  const resolvedPrimaryActionHref =
    primaryActionHref ??
    `/reserver?motorcycle=${motorcycle.slug}&stage=client#client-form`;
  const resolvedPrimaryActionAriaLabel = primaryActionAriaLabel ?? `${primaryActionLabel} ${motorcycle.name}`;

  return (
    <SelectedMotorcycleCard
      motorcycle={motorcycle}
      status={
        <Badge variant={selectedVisible ? "success" : "warning"} size="sm" className="shrink-0">
          {selectedVisible ? "Visible" : "Hors filtre"}
        </Badge>
      }
      emphasis={recommendation}
      contextLabel={contextLabel}
      actions={
        <>
          <Button
            as="link"
            href={resolvedPrimaryActionHref}
            ariaLabel={resolvedPrimaryActionAriaLabel}
            variant="accent"
            size="md"
            className="w-full sm:w-auto"
          >
            {primaryActionLabel}
          </Button>
          <Button
            as="link"
            href={`/motos/${motorcycle.slug}`}
            ariaLabel={`Voir la fiche de ${motorcycle.name}`}
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
          >
            Voir la fiche
          </Button>
        </>
      }
      details={details}
      footerNote={
        footerNote ?? (!selectedVisible ? "Retenue, meme si les filtres la masquent." : null)
      }
    />
  );
}

function getRecommendationLabel(category: CatalogMotorcycle["category"], transmission: CatalogMotorcycle["transmission"]) {
  if (category === "scooter") {
    return "idéale pour la ville";
  }

  if (category === "adventure") {
    return "prête pour les escapades";
  }

  if (category === "touring") {
    return "pensée pour la route";
  }

  if (category === "roadster") {
    return "vive et précise";
  }

  if (category === "sport") {
    return "plus engagée sur route";
  }

  if (category === "custom") {
    return "présence assumée";
  }

  if (category === "electric") {
    return "simple au quotidien";
  }

  return transmission === "automatic" ? "simple à prendre en main" : "équilibrée et lisible";
}
