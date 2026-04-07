import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/app/_shared/lib/cn";
import {
  MOTORCYCLE_TONE_CLASSES,
  type CatalogMotorcycle,
} from "@/app/_features/catalog/data/motorcycles";

type MotorcycleVisualModel = Pick<
  CatalogMotorcycle,
  "brand" | "name" | "monogram" | "primaryImage" | "gallery" | "visualTone"
>;

type MotorcycleVisualProps = {
  motorcycle: MotorcycleVisualModel;
  className?: string;
  sizes?: string;
  priority?: boolean;
  imageSrc?: string;
  children?: ReactNode;
};

export function MotorcycleVisual({
  motorcycle,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  imageSrc,
  children,
}: MotorcycleVisualProps) {
  const resolvedImageSrc = imageSrc || motorcycle.primaryImage || motorcycle.gallery[0] || "";

  return (
    <div
      className={cn(
        "media-frame relative overflow-hidden",
        "bg-gradient-to-br",
        MOTORCYCLE_TONE_CLASSES[motorcycle.visualTone],
        className
      )}
    >
      {resolvedImageSrc ? (
        <Image
          src={resolvedImageSrc}
          alt={`${motorcycle.brand} ${motorcycle.name}`}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover object-center"
        />
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,transparent_24%,rgba(20,17,14,0.02)_72%,rgba(20,17,14,0.14)_100%)]"
      />

      <div className="relative z-10 h-full w-full">
        {children ?? (
          <div className="flex h-full items-end justify-between p-6 sm:p-8">
            <div className="max-w-[18rem] space-y-2">
              <p className="meta-label">{motorcycle.brand}</p>
              <p className="heading-3 text-foreground">{motorcycle.name}</p>
            </div>
            <div className="font-display text-5xl leading-none text-foreground/12">{motorcycle.monogram}</div>
          </div>
        )}
      </div>
    </div>
  );
}
