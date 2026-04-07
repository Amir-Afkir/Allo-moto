import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "outline" | "accent";
export type ButtonSize = "md" | "lg";

export const BUTTON_BASE_CLASSES =
  "motion-lift inline-flex items-center justify-center gap-2 rounded-pill font-semibold cursor-pointer disabled:pointer-events-none disabled:opacity-60 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-sm sm:text-base",
};

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: [
    "border border-transparent bg-foreground text-background shadow-[var(--shadow-button)]",
    "hover:-translate-y-px hover:brightness-95 hover:shadow-[0_16px_30px_rgba(23,20,16,0.16)]",
    "focus-visible:ring-foreground/35",
  ].join(" "),
  outline: [
    "border border-border/70 bg-surface/88 text-foreground shadow-[0_1px_10px_rgba(23,20,16,0.05)] backdrop-blur-md",
    "hover:-translate-y-px hover:border-brand/20 hover:bg-surface-elevated",
    "focus-visible:ring-brand/35",
  ].join(" "),
  accent: [
    "border border-brand/20 bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-background shadow-[0_16px_30px_rgba(166,82,36,0.24)]",
    "hover:-translate-y-px hover:shadow-[0_20px_40px_rgba(166,82,36,0.26)]",
    "focus-visible:ring-brand/45",
  ].join(" "),
};

export function getButtonClasses({
  variant = "primary",
  size = "lg",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(BUTTON_BASE_CLASSES, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className);
}
