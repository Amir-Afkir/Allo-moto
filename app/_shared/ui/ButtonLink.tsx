import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { getButtonClasses, type ButtonSize, type ButtonVariant } from "./button-shared";

type ButtonLinkProps = {
  children: ReactNode;
  href: LinkProps["href"];
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  ariaLabel: string;
  "data-analytics"?: string;
} & Pick<LinkProps, "prefetch" | "replace" | "scroll" | "locale"> & {
  target?: string;
  rel?: string;
};

export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "lg",
  className,
  ariaLabel,
  "data-analytics": da,
  prefetch,
  replace,
  scroll,
  locale,
  target,
  rel,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      locale={locale}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      className={getButtonClasses({ variant, size, className })}
      data-analytics={da}
    >
      {children}
    </Link>
  );
}
