import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-card border border-border/60 bg-surface/72 p-5 sm:p-6", className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="heading-3 text-foreground">{title}</p>
          {description ? <p className="body-copy text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="flex flex-col gap-3 sm:flex-row">{action}</div> : null}
      </div>
    </div>
  );
}
