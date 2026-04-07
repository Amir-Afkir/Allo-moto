import type { ReactNode } from "react";
import { cn } from "@/app/_shared/lib/cn";

type SectionProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  density?: "default" | "compact";
};

export default function Section({
  id,
  title,
  subtitle,
  children,
  className = "",
  density = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "section-shell",
        density === "compact" && "section-shell-compact",
        className,
      )}
    >
      {(title || subtitle) && (
        <header
          className={cn(
            "max-w-3xl",
            density === "compact" ? "mb-4 space-y-2.5" : "mb-6 space-y-4",
          )}
        >
          {title && <h2 className="section-title">{title}</h2>}
          {subtitle && <p className="section-copy">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
