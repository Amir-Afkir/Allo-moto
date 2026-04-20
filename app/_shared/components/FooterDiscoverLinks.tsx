import Link from "next/link";
import {
  getFooterLegalNavItems,
  getFooterNavItems,
} from "@/app/_shared/lib/navigation";

const footerGroupTitleClasses =
  "text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-600";

const quickActionClasses =
  "inline-flex min-h-11 items-center justify-center rounded-pill border border-border/70 bg-surface/88 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_1px_10px_rgba(23,20,16,0.05)] transition-colors hover:border-brand/20 hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type FooterDiscoverLinksProps = {
  supportSummary: string | null;
  phoneHref: string | null;
  whatsappHref: string | null;
  mapsHref: string | null;
};

export default function FooterDiscoverLinks({
  supportSummary,
  phoneHref,
  whatsappHref,
  mapsHref,
}: FooterDiscoverLinksProps) {
  const navItems = getFooterNavItems();
  const legalItems = getFooterLegalNavItems();

  return (
    <div className="grid gap-7 text-sm lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.72fr)_minmax(0,0.86fr)] lg:gap-8">
      <section
        aria-labelledby="footer-support-title"
        className="space-y-3"
      >
        <div className="space-y-2">
          <h2 id="footer-support-title" className={footerGroupTitleClasses}>
            Aide rapide
          </h2>
          <p className="text-[0.95rem] leading-6 text-muted-foreground">
            Permis, dépôt, retrait ou disponibilité.
          </p>
        </div>

        <div className="grid gap-2 min-[390px]:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {whatsappHref ? (
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              aria-label="Contacter Allo Moto sur WhatsApp"
              className={quickActionClasses}
            >
              WhatsApp
            </Link>
          ) : null}
          {phoneHref ? (
            <Link
              href={phoneHref}
              aria-label="Appeler Allo Moto"
              className={quickActionClasses}
            >
              Appeler
            </Link>
          ) : null}
          {mapsHref ? (
            <Link
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              aria-label="Ouvrir le point d’accueil Allo Moto dans Google Maps"
              className={quickActionClasses}
            >
              Carte
            </Link>
          ) : null}
        </div>

        <address className="not-italic text-[0.95rem] leading-6 text-muted-foreground">
          {supportSummary ??
            "Adresse et point d’accueil communiqués avant confirmation."}
        </address>
      </section>

      <nav
        aria-labelledby="footer-explore-title"
        className="space-y-3 lg:border-l lg:border-border/60 lg:pl-8"
      >
        <h2 id="footer-explore-title" className={footerGroupTitleClasses}>
          Explorer
        </h2>
        <ul className="grid gap-2 min-[390px]:grid-cols-2 lg:grid-cols-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <FooterLink href={item.href} label={item.label} />
            </li>
          ))}
        </ul>
      </nav>

      <nav
        aria-labelledby="footer-legal-title"
        className="space-y-3 lg:border-l lg:border-border/60 lg:pl-8"
      >
        <h2 id="footer-legal-title" className={footerGroupTitleClasses}>
          Légal
        </h2>
        <ul className="grid gap-2">
          {legalItems.map((item) => (
            <li key={item.href}>
              <FooterLink href={item.href} label={item.label} variant="quiet" />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function FooterLink({
  href,
  label,
  variant = "default",
}: {
  href: string;
  label: string;
  variant?: "default" | "quiet";
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex min-h-10 w-full items-center rounded-control border px-3 py-2 text-sm font-semibold underline-offset-4 transition-[background-color,border-color,color,text-decoration-color] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "quiet"
          ? "border-transparent bg-transparent text-foreground/70 hover:text-foreground hover:underline"
          : "border-border/60 bg-surface/58 text-foreground/78 hover:border-brand/18 hover:bg-surface-elevated hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
