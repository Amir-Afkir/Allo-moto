"use client";

import { useEffect, useRef, useState } from "react";
import type { SupportMapConfig } from "@/app/_features/support/data/support";

type SupportMapboxCardProps = {
  map: SupportMapConfig | null;
  placeName: string | null;
  addressLines: string[];
};

export default function SupportMapboxCard({
  map,
  placeName,
  addressLines,
}: SupportMapboxCardProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isMapRequested, setIsMapRequested] = useState(false);
  const hasMapConfig = Boolean(map?.accessToken);
  const hasInteractiveMap = hasMapConfig && isMapRequested;

  useEffect(() => {
    if (!hasInteractiveMap || !map?.accessToken || !mapRef.current) {
      return;
    }

    let disposed = false;
    let cleanup = () => {};

    void (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (disposed || !mapRef.current) {
        return;
      }

      mapboxgl.accessToken = map.accessToken;

      const instance = new mapboxgl.Map({
        container: mapRef.current,
        style: map.styleUrl,
        center: [map.longitude, map.latitude],
        zoom: map.zoom,
        pitch: map.pitch,
        bearing: map.bearing,
        cooperativeGestures: true,
        dragRotate: false,
        attributionControl: false,
      });

      instance.scrollZoom.disable();
      instance.touchZoomRotate.disableRotation();
      cleanup = () => instance.remove();
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [hasInteractiveMap, map]);

  return (
    <div className="relative overflow-hidden rounded-card border border-white/10 bg-[#15110d] shadow-[0_28px_80px_rgba(17,14,11,0.34)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(215,157,109,0.28),transparent_34%),radial-gradient(circle_at_82%_14%,rgba(255,255,255,0.12),transparent_26%),linear-gradient(180deg,rgba(10,8,7,0.04),rgba(10,8,7,0.44))]"
      />

      {hasInteractiveMap ? (
        <div
          ref={mapRef}
          className="h-[23rem] w-full sm:h-[25rem]"
          role="region"
          aria-label="Carte interactive du point d’accueil Allo Moto"
        />
      ) : (
        <div className="h-[23rem] w-full bg-[linear-gradient(160deg,#1f1914,#120f0c)] sm:h-[25rem]" />
      )}

      {hasMapConfig && !isMapRequested ? (
        <div className="absolute right-4 top-4 z-20 sm:right-5 sm:top-5">
          <button
            type="button"
            aria-label="Afficher la carte interactive du point d’accueil Allo Moto"
            onClick={() => setIsMapRequested(true)}
            className="inline-flex min-h-11 items-center justify-center rounded-pill border border-white/18 bg-[rgba(255,248,240,0.92)] px-4 py-2 text-sm font-semibold text-foreground shadow-[0_14px_32px_rgba(5,4,3,0.18)] transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15110d]"
          >
            Afficher la carte
          </button>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="rounded-card border border-white/10 bg-[rgba(14,11,9,0.72)] p-4 text-white shadow-[0_22px_60px_rgba(5,4,3,0.28)] backdrop-blur-xl sm:p-6">
          <div className="min-w-0">
            {placeName ? <p className="meta-label text-white/58">{placeName}</p> : null}
            {addressLines.length > 0 ? (
              <div className="mt-2 space-y-2">
                {addressLines.map((line) => (
                  <p key={line} className="body-copy text-white/90">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 body-copy text-white/72">L’adresse est confirmée avant le retrait.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
