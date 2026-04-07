"use client";
import {
  type ReactNode,
  useEffect,
  useId,
} from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/app/_shared/ui/Badge";

type OpsReservationDrawerProps = {
  closeHref: string;
  title: string;
  statusLabel: string;
  statusTone: "warning" | "success";
  periodLabel: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function OpsReservationDrawer({
  closeHref,
  title,
  statusLabel,
  statusTone,
  periodLabel,
  children,
  footer,
}: OpsReservationDrawerProps) {
  const router = useRouter();
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.replace(closeHref);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeHref, router]);

  return (
    <div className="fixed inset-0 z-[10020]">
      <button
        type="button"
        aria-label="Fermer le detail de la demande"
        onClick={() => router.replace(closeHref)}
        className="absolute inset-0 bg-background/56 backdrop-blur-sm"
      />

      <div className="absolute inset-y-0 right-0 w-full max-w-[44rem] p-2 sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="overlay-sheet flex h-full flex-col rounded-[1.75rem] border-border/70"
        >
          <header className="border-b border-border/60 px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusTone}>
                    {statusLabel}
                  </Badge>
                  <span className="rounded-pill border border-border/60 px-3 py-1 text-[0.76rem] font-medium text-foreground/72">
                    {periodLabel}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="meta-label">Demande</p>
                  <h2
                    id={titleId}
                    className="text-[1.25rem] leading-tight font-semibold tracking-[-0.02em] text-foreground"
                  >
                    {title}
                  </h2>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.replace(closeHref)}
                  className="rounded-pill border border-border/60 bg-surface/72 px-4 py-2 text-sm font-semibold text-foreground/74 transition-colors hover:bg-surface hover:text-foreground"
                >
                  Fermer
                </button>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {children}
          </div>

          {footer ? (
            <div className="shrink-0 border-t border-border/60 px-5 py-4 sm:px-6">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
