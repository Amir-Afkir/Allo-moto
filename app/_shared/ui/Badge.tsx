"use client";

import type { ReactNode } from "react";
import { getBadgeClasses, type BadgeSize, type BadgeVariant } from "./badge-shared";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
};

export function Badge({ children, variant = "neutral", size = "md", className }: BadgeProps) {
  return <span className={getBadgeClasses({ variant, size, className })}>{children}</span>;
}
