import { cn } from "../lib/cn";

export type BadgeVariant = "neutral" | "accent" | "outline" | "success" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

export const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  neutral: "border border-border/70 bg-surface-elevated text-foreground",
  accent: "border border-brand/20 bg-brand-soft text-brand-strong",
  outline: "border border-border/70 bg-transparent text-foreground/72",
  success: "border border-success/20 bg-success/8 text-success",
  warning: "border border-warning/20 bg-warning/8 text-warning",
  danger: "border border-error/20 bg-error/8 text-error",
};

export const BADGE_SIZES: Record<BadgeSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-4 py-2 text-xs",
};

export function getBadgeClasses({
  variant = "neutral",
  size = "md",
  className,
}: {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center gap-2 rounded-control font-semibold uppercase tracking-[0.12em]",
    BADGE_VARIANTS[variant],
    BADGE_SIZES[size],
    className
  );
}
