"use client";

import { ButtonLink } from "@/app/_shared/ui/ButtonLink";

type WhatsAppButtonProps = {
  href: string | null;
  label?: string;
  ariaLabel?: string;
  className?: string;
};

export default function WhatsAppButton({ href, label = "Demander sur WhatsApp", ariaLabel, className }: WhatsAppButtonProps) {
  if (!href) {
    return null;
  }

  return (
    <ButtonLink href={href} ariaLabel={ariaLabel ?? label} variant="accent" size="lg" className={className}>
      {label}
    </ButtonLink>
  );
}
