import { Suspense } from "react";
import { ChromeVisibilityGate } from "@/app/_shared/components/ChromeVisibilityGate";
import HeaderChrome from "./HeaderChrome";

export default function Header() {
  return (
    <ChromeVisibilityGate>
      <header className="fixed inset-x-0 top-0 z-[9999] border-b border-border/60 bg-[color-mix(in_srgb,var(--background)_90%,white_10%)] shadow-[0_10px_28px_rgba(35,24,17,0.05)] backdrop-blur-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(179,93,42,0.32),transparent)]"
        />
        <Suspense
          fallback={
            <div className="app-shell h-[6.25rem] lg:h-[4.5rem]" />
          }
        >
          <HeaderChrome />
        </Suspense>
      </header>
    </ChromeVisibilityGate>
  );
}
