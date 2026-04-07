"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/app/_shared/lib/cn";
import { formatMoney } from "@/app/_shared/lib/format";
import { Badge } from "@/app/_shared/ui/Badge";
import { Button } from "@/app/_shared/ui/Button";
import {
  MOTORCYCLE_LICENSE_LABELS,
  MOTORCYCLE_TRANSMISSION_LABELS,
  type CatalogMotorcycle,
  type CatalogPriceBand,
  type CatalogSortKey,
} from "@/app/_features/catalog/data/motorcycles";
import {
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilterState,
} from "@/app/_features/catalog/lib/catalogFilters";
import {
  buildReservationSearchParams,
  createDefaultReservationWindow,
  evaluateReservation,
  formatDateRange,
  type ReservationPickupMode,
} from "@/app/_features/reservation/data/reservation";
import { usePlanningLedger } from "@/app/_features/reservation/hooks/usePlanningLedger";
import type {
  PlanningAvailabilityBlock,
  PlanningReservationRecord,
} from "@/app/_features/reservation/data/reservation-planning";
import { MotoFilterBar } from "./MotoFilterBar";
import { MotoRetenueSidebar } from "./MotoRetenueSidebar";
import { MotorcycleVisual } from "./MotorcycleVisual";

type MotoCatalogClientProps = {
  motorcycles: readonly CatalogMotorcycle[];
  initialPlanningReservations: ReadonlyArray<PlanningReservationRecord>;
  initialPlanningBlocks: ReadonlyArray<PlanningAvailabilityBlock>;
};

const DEFAULT_WINDOW = createDefaultReservationWindow();

export function MotoCatalogClient({
  motorcycles,
  initialPlanningReservations,
  initialPlanningBlocks,
}: MotoCatalogClientProps) {
  const [filters, setFilters] = useState<CatalogFilterState>(DEFAULT_CATALOG_FILTERS);
  const [selectedId, setSelectedId] = useState(
    motorcycles.find((motorcycle) => motorcycle.featured && motorcycle.status === "available")?.slug ??
      motorcycles[0]?.slug ??
      ""
  );
  const [pickupDate, setPickupDate] = useState(DEFAULT_WINDOW.pickupDate);
  const [returnDate, setReturnDate] = useState(DEFAULT_WINDOW.returnDate);
  const [pickupMode, setPickupMode] =
    useState<ReservationPickupMode>("motorcycle-location");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const {
    reservations: planningReservations,
    blocks: planningBlocks,
  } = usePlanningLedger({
    reservations: initialPlanningReservations,
    blocks: initialPlanningBlocks,
  });

  const filteredMotorcycles = useMemo(() => {
    const result = motorcycles
      .filter((motorcycle) => (filters.category === "all" ? true : motorcycle.category === filters.category))
      .filter((motorcycle) => (filters.transmission === "all" ? true : motorcycle.transmission === filters.transmission))
      .filter((motorcycle) => (filters.license === "all" ? true : motorcycle.licenseCategory === filters.license))
      .filter((motorcycle) => matchesPriceBand(motorcycle.priceFrom.amount, filters.price));

    return sortMotorcycles(result, filters.sort);
  }, [filters, motorcycles]);

  const planningEntries = useMemo(
    () =>
      filteredMotorcycles.map((motorcycle) => {
        const evaluation = evaluateReservation({
          motorcycle,
          draft: {
            motorcycleSlug: motorcycle.slug,
            pickupDate,
            returnDate,
            pickupMode,
            permit: "none" as const,
          },
          planningReservations,
          planningBlocks,
        });

        return {
          motorcycle,
          evaluation,
          reservationHref: `/reserver?${buildReservationSearchParams({
            motorcycleSlug: motorcycle.slug,
            pickupDate,
            returnDate,
            pickupMode,
            permit: "none" as const,
            stage: "client",
          })}#client-form`,
        };
      }),
    [
      filteredMotorcycles,
      pickupDate,
      pickupMode,
      planningBlocks,
      planningReservations,
      returnDate,
    ],
  );
  const availableEntries = useMemo(
    () => planningEntries.filter((entry) => entry.evaluation.available),
    [planningEntries],
  );
  const visibleEntries = showOnlyAvailable ? availableEntries : planningEntries;
  const hasBaseMatches = planningEntries.length > 0;
  const hiddenUnavailableCount = Math.max(
    planningEntries.length - visibleEntries.length,
    0,
  );

  useEffect(() => {
    if (visibleEntries.length === 0) {
      return;
    }

    if (visibleEntries.some((entry) => entry.motorcycle.slug === selectedId)) {
      return;
    }

    setSelectedId(visibleEntries[0]?.motorcycle.slug ?? "");
  }, [selectedId, visibleEntries]);

  const selectedMotorcycle =
    visibleEntries.find((entry) => entry.motorcycle.slug === selectedId)?.motorcycle ??
    visibleEntries[0]?.motorcycle ??
    null;
  const selectedPlanning = useMemo(
    () =>
      selectedMotorcycle
        ? evaluateReservation({
            motorcycle: selectedMotorcycle,
          draft: {
            motorcycleSlug: selectedMotorcycle.slug,
            pickupDate,
            returnDate,
            pickupMode,
            permit: "none" as const,
          },
          planningReservations,
          planningBlocks,
        })
        : null,
    [
      pickupDate,
      pickupMode,
      planningBlocks,
      planningReservations,
      returnDate,
      selectedMotorcycle,
    ],
  );
  const selectedVisible = Boolean(
    selectedMotorcycle &&
      visibleEntries.some(
        (entry) => entry.motorcycle.slug === selectedMotorcycle.slug,
      )
  );

  function updateFilter<K extends keyof CatalogFilterState>(key: K, value: CatalogFilterState[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetFilters() {
    const defaultWindow = createDefaultReservationWindow();
    setFilters(DEFAULT_CATALOG_FILTERS);
    setPickupDate(defaultWindow.pickupDate);
    setReturnDate(defaultWindow.returnDate);
    setPickupMode("motorcycle-location");
    setShowOnlyAvailable(true);
    setSelectedId(
      motorcycles.find(
        (motorcycle) => motorcycle.featured && motorcycle.status === "available",
      )?.slug ??
        motorcycles[0]?.slug ??
        "",
    );
  }

  return (
    <div id="availability" className="space-y-5">
      <MotoFilterBar
        filters={filters}
        pickupDate={pickupDate}
        returnDate={returnDate}
        pickupMode={pickupMode}
        showOnlyAvailable={showOnlyAvailable}
        onReset={resetFilters}
        onChange={updateFilter}
        onScheduleApply={(schedule) => {
          setPickupDate(schedule.pickupDate);
          setReturnDate(schedule.returnDate);
          setPickupMode(schedule.pickupMode);
        }}
        onAvailabilityToggle={() => setShowOnlyAvailable((current) => !current)}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 space-y-5 xl:order-1">
          {visibleEntries.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {visibleEntries.length} moto
                {visibleEntries.length > 1 ? "s" : ""}{" "}
                {showOnlyAvailable ? "reservables" : "visibles"} pour{" "}
                {formatDateRange(pickupDate, returnDate)}.
                {showOnlyAvailable && hiddenUnavailableCount > 0
                  ? ` ${hiddenUnavailableCount} ${
                      hiddenUnavailableCount > 1 ? "restent masquees" : "reste masquee"
                    }.`
                  : ""}
              </p>
              {visibleEntries.map(({ motorcycle, evaluation }) => (
                <MotoRow
                  key={motorcycle.slug}
                  motorcycle={motorcycle}
                  selected={selectedMotorcycle?.slug === motorcycle.slug}
                  evaluation={evaluation}
                  onSelect={setSelectedId}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-5 border-y border-border/60 py-6">
              <div className="space-y-2">
                <h3 className="heading-3 text-foreground">
                  {!hasBaseMatches
                    ? "Aucune moto ne correspond."
                    : showOnlyAvailable
                      ? "Aucune moto reservable sur ces dates."
                      : "Aucune moto ne correspond."}
                </h3>
                <p className="body-copy text-muted-foreground">
                  {!hasBaseMatches
                    ? "Elargissez le budget, changez de categorie ou retirez quelques filtres."
                    : showOnlyAvailable
                      ? "Changez le creneau ou ouvrez aussi les motos hors dispo."
                      : "Elargissez le budget, changez de categorie ou retirez quelques filtres."}
                </p>
              </div>

              {hasBaseMatches && showOnlyAvailable ? (
                <Button
                  as="button"
                  type="button"
                  ariaLabel="Afficher aussi les motos indisponibles"
                  variant="accent"
                  size="lg"
                  onClick={() => setShowOnlyAvailable(false)}
                >
                  Voir hors dispo
                </Button>
              ) : (
                <Button
                  as="button"
                  type="button"
                  ariaLabel="Reinitialiser les filtres du catalogue"
                  variant="accent"
                  size="lg"
                  onClick={resetFilters}
                >
                  Tout effacer
                </Button>
              )}
            </div>
          )}
        </div>

        {selectedMotorcycle ? (
          <aside
            id="selected-motorcycle"
            className="order-1 space-y-5 xl:sticky xl:top-[10rem] xl:self-start"
          >
            <MotoRetenueSidebar
              motorcycle={selectedMotorcycle}
              selectedVisible={selectedVisible}
              contextLabel={formatDateRange(pickupDate, returnDate)}
              primaryActionHref={`/reserver?${buildReservationSearchParams({
                motorcycleSlug: selectedMotorcycle.slug,
                pickupDate,
                returnDate,
                pickupMode,
                permit: "none" as const,
                stage: "client",
              })}#client-form`}
              footerNote={
                selectedPlanning?.available
                  ? `Disponible pour ${formatDateRange(pickupDate, returnDate)}.`
                  : selectedPlanning?.blockers[0] ??
                    selectedPlanning?.nextAvailableLabel ??
                    "Creneau a verifier."
              }
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function MotoRow({
  motorcycle,
  selected,
  evaluation,
  onSelect,
}: {
  motorcycle: CatalogMotorcycle;
  selected: boolean;
  evaluation: ReturnType<typeof evaluateReservation>;
  onSelect: (slug: string) => void;
}) {
  const metrics = [
    { label: "Transmission", value: MOTORCYCLE_TRANSMISSION_LABELS[motorcycle.transmission] },
    { label: "Permis", value: MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory] },
    { label: "Km inclus", value: `${motorcycle.includedMileageKmPerDay} km/jour` },
  ];

  return (
    <article
      className={cn(
        "card-motion relative border-t border-border/60 py-4 first:border-t-0 first:pt-0 sm:py-5",
        selected && "border-brand/20 bg-brand-soft/18"
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1fr)_auto] xl:items-start">
        <MotorcycleVisual motorcycle={motorcycle} className="h-32 sm:h-36" sizes="(max-width: 1024px) 100vw, 42vw">
          <></>
        </MotorcycleVisual>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" size="sm">
                {motorcycle.brand}
              </Badge>
              <Badge variant={evaluation.statusTone} size="sm">
                {evaluation.statusLabel}
              </Badge>
            </div>
            <Link
              href={`/motos/${motorcycle.slug}`}
              aria-label={`Ouvrir la fiche de ${motorcycle.name}`}
              className="block heading-3 text-foreground transition-colors hover:text-brand-strong"
            >
              {motorcycle.name}
            </Link>
            <p className="body-copy text-muted-foreground">{motorcycle.editorialNote}</p>
            <p className="text-sm text-foreground/72">
              {evaluation.inventorySummary}
            </p>
            {evaluation.nextAvailableLabel ? (
              <p className="text-xs font-medium text-muted-foreground">
                {evaluation.nextAvailableLabel}
              </p>
            ) : null}
          </div>

          <dl className="grid gap-3 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-4">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={cn(
                  "min-w-0",
                  index === 0 && "sm:text-left",
                  index === 1 && "sm:text-center",
                  index === 2 && "sm:text-right"
                )}
              >
                <dt className="meta-label text-[0.62rem] tracking-[0.16em]">{metric.label}</dt>
                <dd className="mt-1 text-[0.95rem] font-medium leading-tight text-foreground">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex w-full flex-col gap-2 sm:max-w-[11.5rem] lg:items-end">
          <Badge variant="accent" className="whitespace-nowrap">
            {formatMoney(motorcycle.priceFrom.amount, motorcycle.priceFrom.currency)}
            /jour
          </Badge>
          <p className="text-xs font-medium text-muted-foreground lg:text-right">
            Dépôt {formatMoney(motorcycle.deposit.amount, motorcycle.deposit.currency)}
          </p>
          <Button
            as="button"
            type="button"
            ariaLabel={
              selected
                ? `${motorcycle.name} déjà retenue`
                : `Mettre ${motorcycle.name} de côté`
            }
            variant={selected ? "accent" : "outline"}
            size="md"
            className={cn("w-full", selected && "border-brand/30 bg-brand text-white hover:bg-brand-strong")}
            onClick={() => onSelect(motorcycle.slug)}
          >
            {selected ? "Moto retenue" : "Mettre de côté"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function matchesPriceBand(amount: number, band: CatalogPriceBand) {
  if (band === "entry") {
    return amount < 50;
  }

  if (band === "mid") {
    return amount >= 50 && amount < 80;
  }

  if (band === "premium") {
    return amount >= 80;
  }

  return true;
}

function sortMotorcycles(list: readonly CatalogMotorcycle[], sort: CatalogSortKey) {
  const items = [...list];

  if (sort === "price-asc") {
    return items.sort((left, right) => left.priceFrom.amount - right.priceFrom.amount);
  }

  if (sort === "price-desc") {
    return items.sort((left, right) => right.priceFrom.amount - left.priceFrom.amount);
  }

  if (sort === "name") {
    return items.sort((left, right) => `${left.brand} ${left.name}`.localeCompare(`${right.brand} ${right.name}`, "fr"));
  }

  if (sort === "availability") {
    return items.sort((left, right) => getStatusRank(left.status) - getStatusRank(right.status));
  }

  return items.sort((left, right) => {
    const featuredDelta = Number(right.featured) - Number(left.featured);
    if (featuredDelta !== 0) {
      return featuredDelta;
    }

    const availabilityDelta = getStatusRank(left.status) - getStatusRank(right.status);
    if (availabilityDelta !== 0) {
      return availabilityDelta;
    }

    return left.priceFrom.amount - right.priceFrom.amount;
  });
}

function getStatusRank(status: CatalogMotorcycle["status"]) {
  if (status === "available") return 0;
  if (status === "reserved") return 1;
  if (status === "maintenance") return 2;
  if (status === "inactive") return 3;
  return 4;
}
