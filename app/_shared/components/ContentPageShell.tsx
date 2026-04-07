import type { ReactNode } from "react";
import Link from "next/link";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";

type ContentPageShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export default function ContentPageShell({
  eyebrow,
  title,
  subtitle,
  children,
  backHref = "/",
  backLabel = "Retour à l’accueil",
}: ContentPageShellProps) {
  return (
    <main className="app-shell">
      <section className="section-shell pt-0">
        <div className="section-band p-6 sm:p-8">
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              {eyebrow ? <p className="label">{eyebrow}</p> : null}
              <h1 className="heading-1 text-foreground text-balance">{title}</h1>
              {subtitle ? <p className="body-copy max-w-3xl text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={backHref} ariaLabel={backLabel} variant="outline" size="md">
                {backLabel}
              </ButtonLink>
              <Link href="/motos" className="text-sm font-semibold text-brand transition-colors hover:text-brand-strong">
                Voir le catalogue
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
