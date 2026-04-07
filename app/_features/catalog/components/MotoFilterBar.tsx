"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
] as const satisfies ReadonlyArray<{ value: CatalogFilterState["license"]; label: string }>;

const CATEGORY_OPTIONS = [
  { value: "all", label: "Toutes" },
  ...MOTORCYCLE_CATEGORY_OPTIONS,
] as const satisfies ReadonlyArray<{ value: CatalogFilterState["category"]; label: string }>;

const TRANSMISSION_OPTIONS = [
  { value: "all", label: "Toutes" },
  ...MOTORCYCLE_TRANSMISSION_OPTIONS,
] as const satisfies ReadonlyArray<{ value: CatalogFilterState["transmission"]; label: string }>;

type MotoFilterBarProps = {
  filters: CatalogFilterState;
  pickupDate: string;
  returnDate: string;
  pickupMode: ReservationPickupMode;
  showOnlyAvailable: boolean;
  onChange: <K extends keyof CatalogFilterState>(key: K, value: CatalogFilterState[K]) => void;
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
  const [advancedOpen, setAdvancedOpen] = useState(() => hasAdvancedCatalogFilters(filters));
  const [planningOpen, setPlanningOpen] = useState(false);
  const [planningDraft, setPlanningDraft] = useState({
    pickupDate,
    returnDate,
    pickupMode,
  });
  const hasActiveFilters = useMemo(() => hasActiveCatalogFilters(filters), [filters]);
  const advancedFiltersActive = hasAdvancedCatalogFilters(filters);
  const defaultWindow = useMemo(() => createDefaultReservationWindow(), []);
  const hasScheduleFilters =
    pickupDate !== defaultWindow.pickupDate ||
    returnDate !== defaultWindow.returnDate ||
    pickupMode !== "motorcycle-location" ||
    !showOnlyAvailable;

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

  return (
    <div id="availability-filters" className="sticky chrome-offset z-30 space-y-3">
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
          summary={formatDateRange(pickupDate, returnDate)}
          onClick={() => setPlanningOpen(true)}
          className="min-w-[10.75rem]"
        />
        <ToggleChip
          label={showOnlyAvailable ? "Disponibles" : "Toutes"}
          open={showOnlyAvailable}
          onClick={onAvailabilityToggle}
          className="min-w-[8.75rem]"
        />
        <ToggleChip
          label="Avancé"
          open={advancedOpen}
          onClick={() => setAdvancedOpen((current) => !current)}
          className="min-w-[8rem]"
        />
        <ActionChip
          label="Tout effacer"
          onClick={onReset}
          active={hasActiveFilters || hasScheduleFilters}
          className="min-w-[7.75rem]"
        />
      </div>

      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out",
          advancedOpen ? "max-h-64 opacity-100 translate-y-0" : "max-h-0 -translate-y-1 opacity-0 pointer-events-none"
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
              onChange={(value) => onChange("category", value as CatalogFilterState["category"])}
              className="min-w-[10rem]"
            />
            <SelectChip
              label="Transmission"
              value={filters.transmission}
              ariaLabel="Filtrer par transmission"
              options={TRANSMISSION_OPTIONS}
              onChange={(value) => onChange("transmission", value as CatalogFilterState["transmission"])}
              className="min-w-[10.5rem]"
            />
            <SelectChip
              label="Permis moto"
              value={filters.license}
              ariaLabel="Filtrer par permis requis"
              options={LICENSE_OPTIONS}
              onChange={(value) => onChange("license", value as CatalogFilterState["license"])}
              className="min-w-[10.5rem]"
            />
          </div>
        </div>
      </div>
      {planningOpen ? (
        <PlanningFilterModal
          draft={planningDraft}
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
  const selectedLabel = options.find((option) => option.value === value)?.label ?? label;

  return (
    <label
      className={cn(
        "group relative flex min-h-[3.25rem] items-center gap-3 overflow-hidden rounded-pill border border-border/60 bg-surface/92 px-4 py-3 text-left shadow-[0_1px_10px_rgba(23,20,16,0.05)]",
        "transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-px hover:border-brand/20 hover:bg-surface-elevated",
        "focus-within:border-brand/25 focus-within:bg-surface-elevated focus-within:shadow-[0_10px_24px_rgba(23,20,16,0.08)] focus-within:ring-2 focus-within:ring-brand/20 focus-within:ring-offset-2 focus-within:ring-offset-background",
        className
      )}
    >
      {showLabel ? <span className="meta-label shrink-0 text-[0.62rem] tracking-[0.18em]">{label}</span> : null}
      <span className="min-w-0 flex-1 truncate text-[0.95rem] font-medium text-foreground">{selectedLabel}</span>
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
  open,
  onClick,
  className,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "group inline-flex min-h-[3.25rem] items-center gap-2 rounded-pill border border-border/60 bg-surface/92 px-4 py-3 text-sm font-medium text-foreground shadow-[0_1px_10px_rgba(23,20,16,0.05)]",
        "transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-px hover:border-brand/20 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        open && "border-brand/25 bg-brand-soft/12 text-foreground shadow-[0_10px_24px_rgba(23,20,16,0.08)]",
        className
      )}
    >
      <span>{label}</span>
      <ChevronIcon className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180 text-foreground/70")} />
    </button>
  );
}

function PlanningChip({
  summary,
  onClick,
  className,
}: {
  summary: string;
  onClick: () => void;
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
        className
      )}
    >
      {label}
    </button>
  );
}

function PlanningFilterModal({
  draft,
  onDraftChange,
  onClose,
  onApply,
}: {
  draft: {
    pickupDate: string;
    returnDate: string;
    pickupMode: ReservationPickupMode;
  };
  onDraftChange: (value: {
    pickupDate: string;
    returnDate: string;
    pickupMode: ReservationPickupMode;
  }) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/58 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-planning-title"
        className="section-band w-full max-w-2xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="label">Creneau</p>
            <h2 id="catalog-planning-title" className="heading-3 text-foreground">
              Filtrer les motos disponibles
            </h2>
            <p className="text-sm text-muted-foreground">
              Choisissez vos dates et votre retrait.
            </p>
          </div>
          <Button
            as="button"
            type="button"
            ariaLabel="Fermer la modale de filtre de creneau"
            variant="outline"
            size="md"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Depart" htmlFor="catalog-modal-pickup">
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
            Les motos reservables seront prioritaires sur ce creneau.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              as="button"
              type="button"
              ariaLabel="Annuler les modifications du creneau"
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              as="button"
              type="button"
              ariaLabel="Appliquer le filtre de creneau"
              variant="accent"
              size="md"
              onClick={onApply}
            >
              Appliquer
            </Button>
          </div>
        </div>
      </div>
    </div>
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
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
