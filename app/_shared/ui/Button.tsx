"use client";

import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { getButtonClasses, type ButtonSize, type ButtonVariant } from "./button-shared";

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  ariaLabel: string;
  "data-analytics"?: string;
};

export type ButtonAsButtonProps = CommonProps & {
  as: "button";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  href?: undefined;
};

export type ButtonAsLinkProps = CommonProps &
  Omit<LinkProps, "onClick" | "as"> & {
    as: "link";
    href: LinkProps["href"];
    type?: undefined;
    onClick?: undefined;
    disabled?: never;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "lg", className, ariaLabel, "data-analytics": da } = props;
  const classes = getButtonClasses({ variant, size, className });

  if (props.as === "button") {
    return (
      <button
        type={props.type ?? "button"}
        aria-label={ariaLabel}
        className={classes}
        onClick={props.onClick}
        disabled={props.disabled}
        data-analytics={da}
      >
        {props.children}
      </button>
    );
  }

  const {
    as: _internalAs,
    children,
    variant: _variant,
    size: _size,
    className: _className,
    ariaLabel: _ariaLabel,
    "data-analytics": _daProp,
    ...linkProps
  } = props as ButtonAsLinkProps;
  void _internalAs;
  void _variant;
  void _size;
  void _className;
  void _ariaLabel;
  void _daProp;

  return (
    <Link {...(linkProps as Omit<ButtonAsLinkProps, "as" | "children">)} aria-label={ariaLabel} className={classes} data-analytics={da}>
      {children}
    </Link>
  );
}
