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
  const [filters, setFilters] = useState<CatalogFilterState>(
    DEFAULT_CATALOG_FILTERS,
  );
  const [selectedId, setSelectedId] = useState(
    motorcycles.find(
      (motorcycle) => motorcycle.featured && motorcycle.status === "available",
    )?.slug ??
      motorcycles[0]?.slug ??
      "",
  );
  const [hasMobileSelection, setHasMobileSelection] = useState(false);
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
      .filter((motorcycle) =>
        filters.category === "all"
          ? true
          : motorcycle.category === filters.category,
      )
      .filter((motorcycle) =>
        filters.transmission === "all"
          ? true
          : motorcycle.transmission === filters.transmission,
      )
      .filter((motorcycle) =>
        filters.license === "all"
          ? true
          : motorcycle.licenseCategory === filters.license,
      )
      .filter((motorcycle) =>
        matchesPriceBand(motorcycle.priceFrom.amount, filters.price),
      );

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

  const selectedEntry =
    visibleEntries.find((entry) => entry.motorcycle.slug === selectedId) ??
    visibleEntries[0] ??
    null;
  const selectedMotorcycle = selectedEntry?.motorcycle ?? null;
  const selectedPlanning = selectedEntry?.evaluation ?? null;
  const selectedVisible = Boolean(selectedEntry);
  const dateLabel = formatDateRange(pickupDate, returnDate);
  const desktopSummary = buildDesktopSummary({
    count: visibleEntries.length,
    dateLabel,
    hiddenUnavailableCount,
    showOnlyAvailable,
  });

  function updateFilter<K extends keyof CatalogFilterState>(
    key: K,
    value: CatalogFilterState[K],
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function selectMotorcycle(slug: string) {
    setSelectedId(slug);
    setHasMobileSelection(true);
  }

  function resetFilters() {
    const defaultWindow = createDefaultReservationWindow();
    setFilters(DEFAULT_CATALOG_FILTERS);
    setPickupDate(defaultWindow.pickupDate);
    setReturnDate(defaultWindow.returnDate);
    setPickupMode("motorcycle-location");
    setShowOnlyAvailable(true);
    setHasMobileSelection(false);
    setSelectedId(
      motorcycles.find(
        (motorcycle) => motorcycle.featured && motorcycle.status === "available",
      )?.slug ??
        motorcycles[0]?.slug ??
        "",
    );
  }

  return (
    <div id="availability" className="space-y-4 pb-28 xl:space-y-5 xl:pb-0">
      <CatalogResultSummary
        count={visibleEntries.length}
        dateLabel={dateLabel}
        hiddenUnavailableCount={hiddenUnavailableCount}
        showOnlyAvailable={showOnlyAvailable}
      />

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
          setHasMobileSelection(false);
        }}
        onAvailabilityToggle={() => {
          setShowOnlyAvailable((current) => !current);
          setHasMobileSelection(false);
        }}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5 xl:order-1">
          {visibleEntries.length > 0 ? (
            <div className="space-y-4">
              <p
                className="hidden text-sm text-muted-foreground xl:block"
                aria-live="polite"
              >
                {desktopSummary}
              </p>
              {visibleEntries.map(({ motorcycle, evaluation, reservationHref }) => {
                const selected = selectedMotorcycle?.slug === motorcycle.slug;
                const mobileSelected = hasMobileSelection && selected;

                return (
                  <MotoRow
                    key={motorcycle.slug}
                    motorcycle={motorcycle}
                    selected={selected}
                    mobileSelected={mobileSelected}
                    evaluation={evaluation}
                    reservationHref={reservationHref}
                    onSelect={selectMotorcycle}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-5 border-y border-border/60 py-6">
              <div className="space-y-2">
                <h3 className="heading-3 text-foreground">
                  {!hasBaseMatches
                    ? "Aucune moto ne correspond."
                    : showOnlyAvailable
                      ? "Aucune moto réservable sur ces dates."
                      : "Aucune moto ne correspond."}
                </h3>
                <p className="body-copy text-muted-foreground">
                  {!hasBaseMatches
                    ? "Élargissez le budget, changez de catégorie ou retirez quelques filtres."
                    : showOnlyAvailable
                      ? "Changez le créneau ou ouvrez aussi les motos hors disponibilité."
                      : "Élargissez le budget, changez de catégorie ou retirez quelques filtres."}
                </p>
              </div>

              {hasBaseMatches && showOnlyAvailable ? (
                <Button
                  as="button"
                  type="button"
                  ariaLabel="Afficher aussi les motos indisponibles"
                  variant="accent"
                  size="lg"
                  className="min-h-11"
                  onClick={() => setShowOnlyAvailable(false)}
                >
                  Voir hors disponibilité
                </Button>
              ) : (
                <Button
                  as="button"
                  type="button"
                  ariaLabel="Réinitialiser les filtres du catalogue"
                  variant="accent"
                  size="lg"
                  className="min-h-11"
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
            className="hidden space-y-5 xl:sticky xl:top-[10rem] xl:order-2 xl:block xl:self-start"
          >
            <MotoRetenueSidebar
              motorcycle={selectedMotorcycle}
              selectedVisible={selectedVisible}
              contextLabel={dateLabel}
              primaryActionHref={selectedEntry?.reservationHref}
              footerNote={
                selectedPlanning?.available
                  ? `Disponible pour ${dateLabel}.`
                  : selectedPlanning?.blockers[0] ??
                    selectedPlanning?.nextAvailableLabel ??
                    "Créneau à vérifier."
              }
            />
          </aside>
        ) : null}
      </div>

      {hasMobileSelection && selectedMotorcycle && selectedEntry ? (
        <MobileSelectedBar
          motorcycle={selectedMotorcycle}
          reservationHref={selectedEntry.reservationHref}
        />
      ) : null}
    </div>
  );
}

function CatalogResultSummary({
  count,
  dateLabel,
  hiddenUnavailableCount,
  showOnlyAvailable,
}: {
  count: number;
  dateLabel: string;
  hiddenUnavailableCount: number;
  showOnlyAvailable: boolean;
}) {
  return (
    <section
      aria-live="polite"
      className="rounded-card border border-border/60 bg-surface/82 px-4 py-3 shadow-[0_1px_12px_rgba(23,20,16,0.05)] xl:hidden"
    >
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
        <span>
          {count} moto{count > 1 ? "s" : ""}
        </span>
        <span aria-hidden className="text-muted-foreground/45">
          ·
        </span>
        <span>{dateLabel}</span>
        <span aria-hidden className="text-muted-foreground/45">
          ·
        </span>
        <span>{showOnlyAvailable ? "Disponibles" : "Toutes"}</span>
      </div>
      {showOnlyAvailable && hiddenUnavailableCount > 0 ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {hiddenUnavailableCount} moto
          {hiddenUnavailableCount > 1 ? "s sont masquées" : " est masquée"} par
          la disponibilité.
        </p>
      ) : null}
    </section>
  );
}

function MotoRow({
  motorcycle,
  selected,
  mobileSelected,
  evaluation,
  reservationHref,
  onSelect,
}: {
  motorcycle: CatalogMotorcycle;
  selected: boolean;
  mobileSelected: boolean;
  evaluation: ReturnType<typeof evaluateReservation>;
  reservationHref: string;
  onSelect: (slug: string) => void;
}) {
  const metrics = [
    {
      label: "Transmission",
      value: MOTORCYCLE_TRANSMISSION_LABELS[motorcycle.transmission],
    },
    {
      label: "Permis",
      value: MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory],
    },
    { label: "Km inclus", value: `${motorcycle.includedMileageKmPerDay} km/jour` },
  ];

  return (
    <article
      className={cn(
        "card-motion relative overflow-hidden rounded-card border border-border/60 bg-surface p-3 shadow-[0_14px_34px_rgba(35,24,17,0.07)] sm:p-4",
        "xl:overflow-visible xl:rounded-none xl:border-x-0 xl:border-b-0 xl:border-t xl:bg-transparent xl:p-0 xl:py-5 xl:shadow-none xl:first:border-t-0 xl:first:pt-0",
        mobileSelected && "border-brand/30 bg-brand-soft/16",
        selected && "xl:border-brand/20 xl:bg-brand-soft/18",
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1fr)_auto] xl:items-start">
        <MotorcycleVisual
          motorcycle={motorcycle}
          className="h-40 rounded-[1rem] border border-border/50 shadow-none sm:h-44 xl:h-32 xl:rounded-card"
          sizes="(max-width: 1024px) 100vw, 42vw"
          fallbackVariant="monogram"
        />

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge variant="outline" size="sm">
                  {motorcycle.brand}
                </Badge>
                <Badge variant={evaluation.statusTone} size="sm">
                  {evaluation.statusLabel}
                </Badge>
              </div>
              <button
                type="button"
                aria-pressed={mobileSelected}
                aria-label={
                  mobileSelected
                    ? `${motorcycle.name} est retenue`
                    : `Retenir ${motorcycle.name}`
                }
                onClick={() => onSelect(motorcycle.slug)}
                className={cn(
                  "inline-flex min-h-9 shrink-0 items-center rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 xl:hidden",
                  mobileSelected
                    ? "border-brand/25 bg-brand-soft text-brand-700"
                    : "border-border/70 bg-surface-elevated text-foreground/72 hover:text-foreground",
                )}
              >
                {mobileSelected ? "Retenue" : "Retenir"}
              </button>
            </div>

            <Link
              href={`/motos/${motorcycle.slug}`}
              prefetch
              aria-label={`Ouvrir la fiche de ${motorcycle.name}`}
              className="block heading-3 text-foreground transition-colors hover:text-brand-strong"
            >
              {motorcycle.name}
            </Link>
            <p className="body-copy text-muted-foreground">
              {motorcycle.editorialNote}
            </p>
            <p className="text-sm text-foreground/72">
              {evaluation.inventorySummary}
            </p>
            {evaluation.nextAvailableLabel ? (
              <p className="text-xs font-medium text-muted-foreground">
                {evaluation.nextAvailableLabel}
              </p>
            ) : null}
          </div>

          <dl className="grid grid-cols-3 gap-2 rounded-card border border-border/55 bg-background/52 p-3 xl:border-0 xl:bg-transparent xl:p-0 sm:gap-x-6 sm:gap-y-4">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={cn(
                  "min-w-0",
                  index === 0 && "sm:text-left",
                  index === 1 && "sm:text-center",
                  index === 2 && "sm:text-right",
                )}
              >
                <dt className="meta-label text-[0.6rem] tracking-[0.12em] sm:text-[0.62rem] sm:tracking-[0.16em]">
                  {metric.label}
                </dt>
                <dd className="mt-1 text-[0.84rem] font-semibold leading-tight text-foreground sm:text-[0.95rem]">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex w-full flex-col gap-3 sm:max-w-none xl:max-w-[11.5rem] xl:items-end">
          <div className="flex flex-wrap items-end justify-between gap-2 xl:flex-col xl:items-end">
            <Badge variant="accent" className="whitespace-nowrap">
              {formatMoney(motorcycle.priceFrom.amount, motorcycle.priceFrom.currency)}
              /jour
            </Badge>
            <p className="text-xs font-medium text-muted-foreground xl:text-right">
              Dépôt {formatMoney(motorcycle.deposit.amount, motorcycle.deposit.currency)}
            </p>
          </div>

          <div className="grid gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto] xl:hidden">
            <Button
              as="link"
              href={reservationHref}
              ariaLabel={`Réserver ${motorcycle.brand} ${motorcycle.name}`}
              variant="accent"
              size="md"
              className="min-h-11"
            >
              Réserver
            </Button>
            <Button
              as="link"
              href={`/motos/${motorcycle.slug}`}
              prefetch
              ariaLabel={`Voir la fiche de ${motorcycle.brand} ${motorcycle.name}`}
              variant="outline"
              size="md"
              className="min-h-11"
            >
              Fiche
            </Button>
          </div>

          <button
            type="button"
            aria-pressed={selected}
            aria-label={
              selected
                ? `${motorcycle.name} déjà retenue`
                : `Mettre ${motorcycle.name} de côté`
            }
            onClick={() => onSelect(motorcycle.slug)}
            className={cn(
              "hidden min-h-10 w-full items-center justify-center rounded-pill border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background xl:inline-flex",
              selected
                ? "border-brand/30 bg-brand text-white hover:bg-brand-strong"
                : "border-border/70 bg-surface/88 text-foreground hover:border-brand/20 hover:bg-surface-elevated",
            )}
          >
            {selected ? "Moto retenue" : "Mettre de côté"}
          </button>
        </div>
      </div>
    </article>
  );
}

function MobileSelectedBar({
  motorcycle,
  reservationHref,
}: {
  motorcycle: CatalogMotorcycle;
  reservationHref: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 xl:hidden">
      <div className="pointer-events-auto mx-auto max-w-2xl rounded-card border border-border/70 bg-surface/96 p-3 shadow-[0_14px_36px_rgba(23,20,16,0.14)] backdrop-blur-md">
        <div className="grid gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_auto] min-[390px]:items-center">
          <div className="min-w-0">
            <p className="meta-label text-[0.62rem] tracking-[0.14em]">
              Moto retenue
            </p>
            <p className="mt-1 truncate text-[1rem] font-bold leading-tight text-foreground">
              {motorcycle.brand} {motorcycle.name}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {formatMoney(motorcycle.priceFrom.amount, motorcycle.priceFrom.currency)}
              /jour
            </p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Button
              as="link"
              href={reservationHref}
              ariaLabel={`Réserver ${motorcycle.brand} ${motorcycle.name}`}
              variant="accent"
              size="md"
              className="min-h-11"
            >
              Réserver
            </Button>
            <Button
              as="link"
              href={`/motos/${motorcycle.slug}`}
              prefetch
              ariaLabel={`Voir la fiche de ${motorcycle.brand} ${motorcycle.name}`}
              variant="outline"
              size="md"
              className="min-h-11 px-3"
            >
              Fiche
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildDesktopSummary({
  count,
  dateLabel,
  hiddenUnavailableCount,
  showOnlyAvailable,
}: {
  count: number;
  dateLabel: string;
  hiddenUnavailableCount: number;
  showOnlyAvailable: boolean;
}) {
  const countLabel = `${count} moto${count > 1 ? "s" : ""}`;
  const modeLabel = showOnlyAvailable ? "réservables" : "visibles";
  const hiddenLabel =
    showOnlyAvailable && hiddenUnavailableCount > 0
      ? ` ${hiddenUnavailableCount} ${
          hiddenUnavailableCount > 1 ? "restent masquées" : "reste masquée"
        }.`
      : "";

  return `${countLabel} ${modeLabel} pour ${dateLabel}.${hiddenLabel}`;
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
    return items.sort(
      (left, right) => left.priceFrom.amount - right.priceFrom.amount,
    );
  }

  if (sort === "price-desc") {
    return items.sort(
      (left, right) => right.priceFrom.amount - left.priceFrom.amount,
    );
  }

  if (sort === "name") {
    return items.sort((left, right) =>
      `${left.brand} ${left.name}`.localeCompare(
        `${right.brand} ${right.name}`,
        "fr",
      ),
    );
  }

  if (sort === "availability") {
    return items.sort(
      (left, right) => getStatusRank(left.status) - getStatusRank(right.status),
    );
  }

  return items.sort((left, right) => {
    const featuredDelta = Number(right.featured) - Number(left.featured);
    if (featuredDelta !== 0) {
      return featuredDelta;
    }

    const availabilityDelta =
      getStatusRank(left.status) - getStatusRank(right.status);
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
