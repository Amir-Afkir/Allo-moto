import type { ReactNode } from "react";
import { cn } from "@/app/_shared/lib/cn";
import { formatMoney } from "@/app/_shared/lib/format";
import {
  MOTORCYCLE_LICENSE_LABELS,
  MOTORCYCLE_TRANSMISSION_LABELS,
  type CatalogMotorcycle,
} from "@/app/_features/catalog/data/motorcycles";
import { MotorcycleVisual } from "./MotorcycleVisual";

type SelectedMotorcycleCardProps = {
  motorcycle: CatalogMotorcycle;
  status: ReactNode;
  emphasis: string;
  actions: ReactNode;
  contextLabel?: string | null;
  details?: ReactNode;
  footerNote?: ReactNode;
  headerLabel?: string;
  className?: string;
  priority?: boolean;
};

export function SelectedMotorcycleCard({
  motorcycle,
  status,
  emphasis,
  actions,
  contextLabel,
  details,
  footerNote,
  headerLabel = "Moto retenue",
  className,
  priority = false,
}: SelectedMotorcycleCardProps) {
  return (
    <div className={cn("section-band card-motion overflow-hidden", className)}>
      <MotorcycleVisual
        motorcycle={motorcycle}
        className="h-[15.75rem]"
        imageSrc={motorcycle.primaryImage || motorcycle.gallery[0]}
        priority={priority}
      >
        <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="inline-flex items-center rounded-pill border border-white/18 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-md">
              {headerLabel}
            </p>
            {status}
          </div>

          <div className="space-y-2">
            <h2 className="text-[2rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.42)] sm:text-[2.25rem]">
              {motorcycle.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-white/86">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success shadow-[0_0_0_4px_rgba(95,177,125,0.18)]" />
              <span className="font-medium">{emphasis}</span>
            </div>
            {contextLabel ? (
              <div className="pt-1">
                <span className="inline-flex max-w-full items-center gap-2 rounded-pill border border-white/18 bg-white/10 px-3 py-1 text-[0.72rem] font-medium text-white/88 backdrop-blur-md">
                  <CalendarIcon />
                  <span className="truncate">{contextLabel}</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </MotorcycleVisual>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0 space-y-1.5">
            <p className="meta-label text-[0.68rem] tracking-[0.18em]">Prix / jour</p>
            <p className="font-display text-[clamp(1.8rem,5vw,2.3rem)] leading-[0.95] tracking-[-0.05em] text-foreground whitespace-nowrap">
              {formatMoney(motorcycle.priceFrom.amount, motorcycle.priceFrom.currency)}
            </p>
          </div>
          <div className="min-w-0 space-y-1.5 sm:text-right">
            <p className="meta-label text-[0.68rem] tracking-[0.18em]">Dépôt</p>
            <p className="heading-3 text-[clamp(1.1rem,3vw,1.35rem)] leading-none whitespace-nowrap text-foreground sm:ml-auto">
              {formatMoney(motorcycle.deposit.amount, motorcycle.deposit.currency)}
            </p>
          </div>
        </div>

        <div className="h-px bg-border/70" />

        <div className="grid gap-3 sm:grid-cols-[repeat(2,max-content)] sm:justify-start">
          <SidebarFeatureTile
            label="Permis"
            value={MOTORCYCLE_LICENSE_LABELS[motorcycle.licenseCategory]}
            icon={<PermitIcon />}
          />
          <SidebarFeatureTile
            label="Transmission"
            value={MOTORCYCLE_TRANSMISSION_LABELS[motorcycle.transmission]}
            icon={<TransmissionIcon />}
          />
        </div>

        <div className="h-px bg-border/55" />

        <div className="flex items-center justify-between gap-4 py-2">
          <p className="meta-label text-[0.68rem] tracking-[0.18em]">Km inclus / jour</p>
          <p className="text-[0.94rem] font-semibold leading-tight text-foreground whitespace-nowrap">
            {motorcycle.includedMileageKmPerDay} km/jour
          </p>
        </div>

        {details ? (
          <>
            <div className="h-px bg-border/55" />
            <div className="grid gap-3 sm:grid-cols-2">{details}</div>
          </>
        ) : null}

        <div className="h-px bg-border/55" />

        <div className="flex flex-col gap-2.5 sm:flex-row">{actions}</div>

        {footerNote ? <div className="text-xs text-muted-foreground">{footerNote}</div> : null}
      </div>
    </div>
  );
}

function SidebarFeatureTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex w-fit min-w-0 items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-surface text-brand-strong">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="meta-label text-[0.68rem] tracking-[0.16em]">{label}</p>
        <p className="mt-1 text-[0.94rem] font-semibold leading-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

function PermitIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4.5" y="6.5" width="15" height="11" rx="2.5" />
      <path d="M8 11h8M8 14h5" strokeLinecap="round" />
    </svg>
  );
}

function TransmissionIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 5v14M16 5v14" strokeLinecap="round" />
      <circle cx="8" cy="10" r="1.8" />
      <circle cx="16" cy="14" r="1.8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        d="M6.5 2.75v2M13.5 2.75v2M3.75 7h12.5M5.75 4.75h8.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-8.5a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
