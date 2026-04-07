"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function ChromeVisibilityGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";

  if (pathname.startsWith("/ops")) {
    return null;
  }

  return <>{children}</>;
}
