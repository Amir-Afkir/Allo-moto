import Image from "next/image";
import { cn } from "@/app/_shared/lib/cn";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

const SIZE_CLASSES: Record<NonNullable<BrandMarkProps["size"]>, string> = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-14 w-14",
};

export default function BrandMark({
  size = "md",
  className,
  imageClassName,
  priority = false,
}: BrandMarkProps) {
  return (
    <span
      className={cn("relative block shrink-0", SIZE_CLASSES[size], className)}
    >
      <Image
        src="/logo-allo-moto-512.webp"
        alt=""
        width={512}
        height={512}
        priority={priority}
        sizes="(max-width: 1024px) 48px, 56px"
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}
