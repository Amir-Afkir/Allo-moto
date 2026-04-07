import Link from "next/link";
import {
  getFooterLegalNavItems,
  getFooterNavItems,
} from "@/app/_shared/lib/navigation";

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
    <nav aria-label="Liens utiles et contact du pied de page" className="grid gap-7 text-sm lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.72fr)_minmax(0,0.86fr)] lg:gap-8">
      <div className="space-y-2.5">
        <p className="meta-label">Aide</p>
        <p className="text-[0.95rem] leading-6 text-muted-foreground">Permis, dépôt, retrait ou disponibilité.</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold text-brand">
          {whatsappHref ? (
            <Link href={whatsappHref} target="_blank" rel="noreferrer" className="transition-colors hover:text-brand-strong">
              WhatsApp
            </Link>
          ) : null}
          {phoneHref ? (
            <Link href={phoneHref} className="transition-colors hover:text-brand-strong">
              Appeler
            </Link>
          ) : null}
        </div>

        <p className="text-[0.95rem] leading-6 text-muted-foreground">{supportSummary ?? "Adresse et point d’accueil communiqués avant confirmation."}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold text-brand">
          {mapsHref ? (
            <Link href={mapsHref} target="_blank" rel="noreferrer" className="transition-colors hover:text-brand-strong">
              Point d’accueil / carte
            </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-2.5 lg:border-l lg:border-border/60 lg:pl-8">
        <p className="meta-label">Explorer</p>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <FooterLink href={item.href} label={item.label} />
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2.5 lg:border-l lg:border-border/60 lg:pl-8">
        <p className="meta-label">Légal</p>
        <ul className="space-y-2">
          {legalItems.map((item) => (
            <li key={item.href}>
              <FooterLink href={item.href} label={item.label} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-foreground/72 underline-offset-4 transition-[color,text-decoration-color] duration-200 hover:text-foreground hover:underline"
    >
      {label}
    </Link>
  );
}
