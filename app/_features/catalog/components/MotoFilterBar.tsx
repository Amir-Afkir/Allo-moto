"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode,
  type RefObject,
} from "react";
import {
  MOTORCYCLE_CATEGORY_OPTIONS,
  MOTORCYCLE_LICENSE_OPTIONS,
  MOTORCYCLE_TRANSMISSION_OPTIONS,
  type CatalogPriceBand,
  type CatalogSortKey,
} from "@/app/_features/catalog/data/motorcycles";
import { cn } from "@/app/_shared/lib/cn";
import { Button } from "@/app/_shared/ui/Button";
import { Input } from "@/app/_shared/ui/Input";
import { Label } from "@/app/_shared/ui/Label";
import {
  hasActiveCatalogFilters,
  hasAdvancedCatalogFilters,
  type CatalogFilterState,
} from "@/app/_features/catalog/lib/catalogFilters";
import {
  createDefaultReservationWindow,
  formatDateInputValue,
  formatDateRange,
  parseReservationPickupMode,
  PICKUP_MODE_OPTIONS,
  type ReservationPickupMode,
} from "@/app/_features/reservation/data/reservation";

const SORT_OPTIONS = [
  { value: "recommended", label: "Pertinence" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "name", label: "Nom" },
] as const satisfies ReadonlyArray<{ value: CatalogSortKey; label: string }>;

const PRICE_OPTIONS = [
  { value: "all", label: "Tous les budgets" },
  { value: "entry", label: "Entrée de gamme" },
  { value: "mid", label: "Milieu de gamme" },
  { value: "premium", label: "Premium" },
] as const satisfies ReadonlyArray<{ value: CatalogPriceBand; label: string }>;

const LICENSE_OPTIONS = [
  { value: "all", label: "Tous" },
  ...MOTORCYCLE_LICENSE_OPTIONS,
] as const satisfies ReadonlyArray<{
  value: CatalogFilterState["license"];
  label: string;
}>;

const CATEGORY_OPTIONS = [
  { value: "all", label: "Toutes" },
  ...MOTORCYCLE_CATEGORY_OPTIONS,
] as const satisfies ReadonlyArray<{
  value: CatalogFilterState["category"];
  label: string;
}>;

const TRANSMISSION_OPTIONS = [
  { value: "all", label: "Toutes" },
  ...MOTORCYCLE_TRANSMISSION_OPTIONS,
] as const satisfies ReadonlyArray<{
  value: CatalogFilterState["transmission"];
  label: string;
}>;

type MotoFilterBarProps = {
  filters: CatalogFilterState;
  pickupDate: string;
  returnDate: string;
  pickupMode: ReservationPickupMode;
  showOnlyAvailable: boolean;
  onChange: <K extends keyof CatalogFilterState>(
    key: K,
    value: CatalogFilterState[K],
  ) => void;
  onScheduleApply: (schedule: {
    pickupDate: string;
    returnDate: string;
    pickupMode: ReservationPickupMode;
  }) => void;
  onAvailabilityToggle: () => void;
  onReset: () => void;
};

export function MotoFilterBar({
  filters,
  pickupDate,
  returnDate,
  pickupMode,
  showOnlyAvailable,
  onChange,
  onScheduleApply,
  onAvailabilityToggle,
  onReset,
}: MotoFilterBarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    hasAdvancedCatalogFilters(filters),
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);
  const [planningDraft, setPlanningDraft] = useState({
    pickupDate,
    returnDate,
    pickupMode,
  });
  const planningReturnFocusRef = useRef<HTMLElement | null>(null);
  const filterReturnFocusRef = useRef<HTMLElement | null>(null);
  const hasActiveFilters = useMemo(
    () => hasActiveCatalogFilters(filters),
    [filters],
  );
  const advancedFiltersActive = hasAdvancedCatalogFilters(filters);
  const defaultWindow = useMemo(() => createDefaultReservationWindow(), []);
  const hasScheduleFilters =
    pickupDate !== defaultWindow.pickupDate ||
    returnDate !== defaultWindow.returnDate ||
    pickupMode !== "motorcycle-location" ||
    !showOnlyAvailable;
  const canReset = hasActiveFilters || hasScheduleFilters;
  const advancedFilterCount = getAdvancedFilterCount(filters);
  const dateSummary = formatDateRange(pickupDate, returnDate);
  const licenseChipLabel =
    filters.license === "all"
      ? "Permis"
      : getOptionLabel(LICENSE_OPTIONS, filters.license);
  const priceChipLabel =
    filters.price === "all"
      ? "Budget"
      : getOptionLabel(PRICE_OPTIONS, filters.price);

  useEffect(() => {
    if (advancedFiltersActive) {
      setAdvancedOpen(true);
    }
  }, [advancedFiltersActive]);

  useEffect(() => {
    if (planningOpen) {
      return;
    }

    setPlanningDraft({
      pickupDate,
      returnDate,
      pickupMode,
    });
  }, [pickupDate, returnDate, pickupMode, planningOpen]);

  function openPlanningFilter(
    event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
  ) {
    planningReturnFocusRef.current = event.currentTarget;
    setPlanningOpen(true);
  }

  function openFilterSheet(
    event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
  ) {
    filterReturnFocusRef.current = event.currentTarget;
    setFilterSheetOpen(true);
  }

  return (
    <div id="availability-filters" className="sticky chrome-offset z-30">
      <div className="space-y-2 bg-background/92 py-2 backdrop-blur-sm xl:hidden">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          <MobileToolbarButton
            label="Dates"
            value={dateSummary}
            icon={<CalendarIcon className="h-4 w-4" />}
            onClick={openPlanningFilter}
          />
          <MobileToggleButton
            label={showOnlyAvailable ? "Disponibles" : "Toutes"}
            pressed={showOnlyAvailable}
            onClick={onAvailabilityToggle}
          />
          <MobileSelectChip
            label={licenseChipLabel}
            value={filters.license}
            active={filters.license !== "all"}
            ariaLabel="Filtrer par permis requis"
            options={LICENSE_OPTIONS}
            onChange={(value) => onChange("license", value)}
          />
          <MobileSelectChip
            label={priceChipLabel}
            value={filters.price}
            active={filters.price !== "all"}
            ariaLabel="Filtrer par budget"
            options={PRICE_OPTIONS}
            onChange={(value) => onChange("price", value)}
          />
          <MobileToolbarButton
            label={advancedFilterCount > 0 ? `Plus (${advancedFilterCount})` : "Plus"}
            value="Filtres"
            expanded={filterSheetOpen}
            onClick={openFilterSheet}
          />
          {canReset ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-10 shrink-0 items-center rounded-pill border border-border/60 bg-surface/80 px-3 py-2 text-xs font-semibold text-foreground/72 transition-colors hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Effacer
            </button>
          ) : null}
        </div>
      </div>

      <div className="hidden space-y-3 xl:block">
        <div className="flex flex-wrap items-center gap-3">
          <SelectChip
            label="Pertinence"
            value={filters.sort}
            ariaLabel="Trier les motos"
            options={SORT_OPTIONS}
            onChange={(value) => onChange("sort", value as CatalogSortKey)}
            showLabel={false}
            className="min-w-[9.5rem]"
          />
          <PlanningChip
            summary={dateSummary}
            onClick={openPlanningFilter}
            className="min-w-[10.75rem]"
          />
          <ToggleChip
            label={showOnlyAvailable ? "Disponibles" : "Toutes"}
            active={showOnlyAvailable}
            ariaMode="pressed"
            onClick={onAvailabilityToggle}
            className="min-w-[8.75rem]"
          />
          <ToggleChip
            label="Avancé"
            active={advancedOpen}
            ariaMode="expanded"
            onClick={() => setAdvancedOpen((current) => !current)}
            className="min-w-[8rem]"
          />
          <ActionChip
            label="Tout effacer"
            onClick={onReset}
            active={canReset}
            className="min-w-[7.75rem]"
          />
        </div>

        <div
          className={cn(
            "overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out",
            advancedOpen
              ? "max-h-64 translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-1 opacity-0",
          )}
        >
          <div className="pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <SelectChip
                label="Prix"
                value={filters.price}
                ariaLabel="Filtrer par budget"
                options={PRICE_OPTIONS}
                onChange={(value) => onChange("price", value as CatalogPriceBand)}
                className="min-w-[10.75rem]"
              />
              <SelectChip
                label="Catégorie"
                value={filters.category}
                ariaLabel="Filtrer par catégorie"
                options={CATEGORY_OPTIONS}
                onChange={(value) =>
                  onChange("category", value as CatalogFilterState["category"])
                }
                className="min-w-[10rem]"
              />
              <SelectChip
                label="Transmission"
                value={filters.transmission}
                ariaLabel="Filtrer par transmission"
                options={TRANSMISSION_OPTIONS}
                onChange={(value) =>
                  onChange(
                    "transmission",
                    value as CatalogFilterState["transmission"],
                  )
                }
                className="min-w-[10.5rem]"
              />
              <SelectChip
                label="Permis moto"
                value={filters.license}
                ariaLabel="Filtrer par permis requis"
                options={LICENSE_OPTIONS}
                onChange={(value) =>
                  onChange("license", value as CatalogFilterState["license"])
                }
                className="min-w-[10.5rem]"
              />
            </div>
          </div>
        </div>
      </div>

      {filterSheetOpen ? (
        <AdvancedFilterSheet
          filters={filters}
          returnFocusRef={filterReturnFocusRef}
          onChange={onChange}
          onReset={onReset}
          onClose={() => setFilterSheetOpen(false)}
        />
      ) : null}

      {planningOpen ? (
        <PlanningFilterModal
          draft={planningDraft}
          returnFocusRef={planningReturnFocusRef}
          onDraftChange={setPlanningDraft}
          onClose={() => setPlanningOpen(false)}
          onApply={() => {
            onScheduleApply(planningDraft);
            setPlanningOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function MobileToolbarButton({
  label,
  value,
  icon,
  expanded,
  onClick,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  expanded?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  const ariaProps =
    typeof expanded === "boolean" ? { "aria-expanded": expanded } : {};

  return (
    <button
      type="button"
      onClick={onClick}
      {...ariaProps}
      className="inline-flex min-h-10 min-w-[7.25rem] shrink-0 items-center gap-2 rounded-pill border border-border/60 bg-surface/92 px-3 py-2 text-left shadow-[0_1px_10px_rgba(23,20,16,0.05)] transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {icon ? (
        <span className="shrink-0 text-muted-foreground">{icon}</span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-[0.68rem] font-semibold uppercase leading-none tracking-[0.1em] text-muted-foreground">
          {label}
        </span>
        <span className="mt-1 block truncate text-xs font-semibold leading-none text-foreground">
          {value}
        </span>
      </span>
    </button>
  );
}

function MobileToggleButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center rounded-pill border px-3 py-2 text-xs font-semibold shadow-[0_1px_10px_rgba(23,20,16,0.05)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        pressed
          ? "border-brand/25 bg-brand-soft text-brand-700"
          : "border-border/60 bg-surface/92 text-foreground/72 hover:bg-surface-elevated hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function MobileSelectChip<T extends string>({
  label,
  value,
  active,
  options,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: T;
  active: boolean;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <label
      className={cn(
        "relative inline-flex min-h-10 shrink-0 items-center rounded-pill border px-3 py-2 text-xs font-semibold shadow-[0_1px_10px_rgba(23,20,16,0.05)] transition-colors focus-within:ring-2 focus-within:ring-brand/35 focus-within:ring-offset-2 focus-within:ring-offset-background",
        active
          ? "border-brand/25 bg-brand-soft text-brand-700"
          : "border-border/60 bg-surface/92 text-foreground/72 hover:bg-surface-elevated hover:text-foreground",
      )}
    >
      <span className="pr-4">{label}</span>
      <ChevronIcon className="absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectChip<T extends string>({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  showLabel = true,
  className,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
  showLabel?: boolean;
  className?: string;
}) {
  const selectedLabel = getOptionLabel(options, value, label);

  return (
    <label
      className={cn(
        "group relative flex min-h-[3.25rem] items-center gap-3 overflow-hidden rounded-pill border border-border/60 bg-surface/92 px-4 py-3 text-left shadow-[0_1px_10px_rgba(23,20,16,0.05)]",
        "transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-px hover:border-brand/20 hover:bg-surface-elevated",
        "focus-within:border-brand/25 focus-within:bg-surface-elevated focus-within:shadow-[0_10px_24px_rgba(23,20,16,0.08)] focus-within:ring-2 focus-within:ring-brand/20 focus-within:ring-offset-2 focus-within:ring-offset-background",
        className,
      )}
    >
      {showLabel ? (
        <span className="meta-label shrink-0 text-[0.62rem] tracking-[0.18em]">
          {label}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-[0.95rem] font-medium text-foreground">
        {selectedLabel}
      </span>
      <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-y-px" />
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleChip({
  label,
  active,
  ariaMode,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  ariaMode: "pressed" | "expanded";
  onClick: () => void;
  className?: string;
}) {
  const ariaProps =
    ariaMode === "pressed"
      ? { "aria-pressed": active }
      : { "aria-expanded": active };

  return (
    <button
      type="button"
      onClick={onClick}
      {...ariaProps}
      className={cn(
        "group inline-flex min-h-[3.25rem] items-center gap-2 rounded-pill border border-border/60 bg-surface/92 px-4 py-3 text-sm font-medium text-foreground shadow-[0_1px_10px_rgba(23,20,16,0.05)]",
        "transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-px hover:border-brand/20 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active &&
          "border-brand/25 bg-brand-soft/12 text-foreground shadow-[0_10px_24px_rgba(23,20,16,0.08)]",
        className,
      )}
    >
      <span>{label}</span>
      {ariaMode === "expanded" ? (
        <ChevronIcon
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            active && "rotate-180 text-foreground/70",
          )}
        />
      ) : null}
    </button>
  );
}

function PlanningChip({
  summary,
  onClick,
  className,
}: {
  summary: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex min-h-[3.25rem] min-w-0 items-center gap-3 rounded-pill border border-border/60 bg-surface/92 px-4 py-3 text-left shadow-[0_1px_10px_rgba(23,20,16,0.05)]",
        "transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-px hover:border-brand/20 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-[0.95rem] font-medium text-foreground">
        {summary}
      </span>
      <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-y-px" />
    </button>
  );
}

function ActionChip({
  label,
  onClick,
  active,
  className,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[3.25rem] items-center rounded-pill border border-border/60 bg-surface/92 px-4 py-3 text-sm font-medium text-foreground shadow-[0_1px_10px_rgba(23,20,16,0.05)]",
        "transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-px hover:border-brand/20 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "border-brand/25 bg-brand-soft/12 text-foreground shadow-[0_10px_24px_rgba(23,20,16,0.08)]"
          : "text-muted-foreground",
        className,
      )}
    >
      {label}
    </button>
  );
}

function AdvancedFilterSheet({
  filters,
  returnFocusRef,
  onChange,
  onReset,
  onClose,
}: {
  filters: CatalogFilterState;
  returnFocusRef: RefObject<HTMLElement | null>;
  onChange: MotoFilterBarProps["onChange"];
  onReset: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useDialogLifecycle({
    active: true,
    dialogRef,
    initialFocusRef: titleRef,
    returnFocusRef,
    onClose,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/58 p-3 backdrop-blur-sm xl:hidden">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filter-title"
        className="w-full max-w-xl overflow-hidden rounded-t-[1.25rem] border border-border/70 bg-surface shadow-[0_18px_48px_rgba(23,20,16,0.16)]"
      >
        <div className="border-b border-border/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <p className="label">Filtres</p>
              <h2
                ref={titleRef}
                id="catalog-filter-title"
                tabIndex={-1}
                className="heading-3 text-foreground focus:outline-none"
              >
                Affiner le catalogue
              </h2>
            </div>
            <button
              type="button"
              aria-label="Fermer les filtres"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-surface-elevated text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
            >
              <span aria-hidden className="text-lg leading-none">
                ×
              </span>
            </button>
          </div>
        </div>

        <div className="max-h-[min(66svh,34rem)] overflow-y-auto p-4">
          <div className="grid gap-4">
            <SheetSelect
              label="Permis"
              value={filters.license}
              options={LICENSE_OPTIONS}
              onChange={(value) => onChange("license", value)}
            />
            <SheetSelect
              label="Budget"
              value={filters.price}
              options={PRICE_OPTIONS}
              onChange={(value) => onChange("price", value)}
            />
            <SheetSelect
              label="Catégorie"
              value={filters.category}
              options={CATEGORY_OPTIONS}
              onChange={(value) => onChange("category", value)}
            />
            <SheetSelect
              label="Transmission"
              value={filters.transmission}
              options={TRANSMISSION_OPTIONS}
              onChange={(value) => onChange("transmission", value)}
            />
            <SheetSelect
              label="Tri"
              value={filters.sort}
              options={SORT_OPTIONS}
              onChange={(value) => onChange("sort", value)}
            />
          </div>
        </div>

        <div className="grid gap-2 border-t border-border/60 p-4 min-[390px]:grid-cols-2">
          <Button
            as="button"
            type="button"
            ariaLabel="Réinitialiser les filtres du catalogue"
            variant="outline"
            size="md"
            className="min-h-11"
            onClick={() => {
              onReset();
              onClose();
            }}
          >
            Réinitialiser
          </Button>
          <Button
            as="button"
            type="button"
            ariaLabel="Appliquer les filtres du catalogue"
            variant="accent"
            size="md"
            className="min-h-11"
            onClick={onClose}
          >
            Appliquer
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanningFilterModal({
  draft,
  returnFocusRef,
  onDraftChange,
  onClose,
  onApply,
}: {
  draft: {
    pickupDate: string;
    returnDate: string;
    pickupMode: ReservationPickupMode;
  };
  returnFocusRef: RefObject<HTMLElement | null>;
  onDraftChange: (value: {
    pickupDate: string;
    returnDate: string;
    pickupMode: ReservationPickupMode;
  }) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useDialogLifecycle({
    active: true,
    dialogRef,
    initialFocusRef: titleRef,
    returnFocusRef,
    onClose,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/58 p-3 backdrop-blur-sm sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-planning-title"
        className="section-band flex max-h-[min(86svh,42rem)] w-full max-w-2xl flex-col overflow-hidden p-0"
      >
        <div className="border-b border-border/60 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="label">Créneau</p>
              <h2
                ref={titleRef}
                id="catalog-planning-title"
                tabIndex={-1}
                className="heading-3 text-foreground focus:outline-none"
              >
                Filtrer les motos disponibles
              </h2>
              <p className="text-sm text-muted-foreground">
                Choisissez vos dates et votre retrait.
              </p>
            </div>
            <Button
              as="button"
              type="button"
              ariaLabel="Fermer la modale de filtre de créneau"
              variant="outline"
              size="md"
              className="min-h-11"
              onClick={onClose}
            >
              Fermer
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Départ" htmlFor="catalog-modal-pickup">
              <Input
                id="catalog-modal-pickup"
                type="date"
                value={draft.pickupDate}
                min={formatDateInputValue(new Date())}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    pickupDate: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Retour" htmlFor="catalog-modal-return">
              <Input
                id="catalog-modal-return"
                type="date"
                value={draft.returnDate}
                min={draft.pickupDate || formatDateInputValue(new Date())}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    returnDate: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Retrait" htmlFor="catalog-modal-pickup-mode">
              <select
                id="catalog-modal-pickup-mode"
                value={draft.pickupMode}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    pickupMode: parseReservationPickupMode(event.target.value),
                  })
                }
                className="input-shell appearance-none pr-10"
              >
                {PICKUP_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Les motos réservables seront prioritaires sur ce créneau.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                as="button"
                type="button"
                ariaLabel="Annuler les modifications du créneau"
                variant="outline"
                size="md"
                className="min-h-11"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button
                as="button"
                type="button"
                ariaLabel="Appliquer le filtre de créneau"
                variant="accent"
                size="md"
                className="min-h-11"
                onClick={onApply}
              >
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SheetSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  const id = `catalog-sheet-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="input-shell appearance-none pr-10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function useDialogLifecycle({
  active,
  dialogRef,
  initialFocusRef,
  returnFocusRef,
  onClose,
}: {
  active: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
  returnFocusRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const returnFocusElement = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      initialFocusRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);

      if (focusableElements.length === 0) {
        event.preventDefault();
        initialFocusRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusElement?.focus();
    };
  }, [active, dialogRef, initialFocusRef, returnFocusRef]);
}

function getOptionLabel<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T,
  fallback = "",
) {
  return options.find((option) => option.value === value)?.label ?? fallback;
}

function getAdvancedFilterCount(filters: CatalogFilterState) {
  return [
    filters.license !== "all",
    filters.price !== "all",
    filters.category !== "all",
    filters.transmission !== "all",
    filters.sort !== "recommended",
  ].filter(Boolean).length;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M6.5 2.75v2M13.5 2.75v2M3.75 7h12.5M5.75 4.75h8.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-8.5a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
