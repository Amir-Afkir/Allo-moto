import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div {...props} className={cn("animate-pulse rounded-card bg-surface-elevated/70", className)} />;
}
