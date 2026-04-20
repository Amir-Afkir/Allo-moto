"use client";

import { useId, useState } from "react";
import { cn } from "@/app/_shared/lib/cn";

export type ReadinessFaqItem = {
  question: string;
  answer: string;
};

type ReadinessFaqProps = {
  items: readonly ReadinessFaqItem[];
};

export default function ReadinessFaq({ items }: ReadinessFaqProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="border-y border-border/60">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-faq-panel-${index}`;
        const buttonId = `${baseId}-faq-button-${index}`;

        return (
          <div key={item.question} className="border-b border-border/60 last:border-b-0">
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="grid w-full grid-cols-[minmax(0,1fr)_2rem] items-center gap-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35"
            >
              <span className="text-[1rem] font-semibold leading-6 text-foreground">
                {item.question}
              </span>
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface/72 text-lg leading-none text-brand transition-transform duration-200",
                  isOpen && "rotate-45 border-brand/20 bg-brand-soft",
                )}
              >
                +
              </span>
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-4 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
