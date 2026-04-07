"use client";

import type { LabelHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
};

export function Label({ className, ...props }: LabelProps) {
  return <label {...props} className={cn("text-sm font-semibold text-foreground", className)} />;
}
