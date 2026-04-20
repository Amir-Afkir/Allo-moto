"use client";

import Image from "next/image";
import { useState } from "react";
import { CATALOG_AVAILABILITY_HREF } from "@/app/_shared/lib/navigation";
import { cn } from "@/app/_shared/lib/cn";
import { Badge } from "@/app/_shared/ui/Badge";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";

type DurationFilter = "short" | "half-day" | "day";

type DestinationRoute = {
  slug: string;
  filter: DurationFilter;
  title: string;
  duration: string;
  distance: string;
  level: string;
  motorcycle: string;
  summary: string;
  detail: string;
  steps: readonly string[];
  image: {
    src: string;
    alt: string;
    position: string;
  };
};

const durationFilters: ReadonlyArray<{
  value: DurationFilter;
  label: string;
  copy: string;
}> = [
  { value: "short", label: "Court", copy: "1h30-2h" },
  { value: "half-day", label: "Demi-journée", copy: "2h-3h30" },
  { value: "day", label: "Longue", copy: "110-140 km" },
];

const destinationRoutes: ReadonlyArray<DestinationRoute> = [
  {
    slug: "canal-loire",
    filter: "short",
    title: "Canal & Loire",
    duration: "1h30-2h",
    distance: "60-75 km",
    level: "Facile",
    motorcycle: "Scooter premium ou A2",
    summary: "Balade fluide, proche, idéale pour une première sortie.",
    detail:
      "Une boucle souple depuis Orléans pour longer la Loire, filer vers Combleux, respirer au canal d’Orléans puis revenir par Jargeau.",
    steps: ["Orléans", "Combleux", "Donnery", "Jargeau"],
    image: {
      src: "/baniere/loire-1536.webp",
      alt: "Motard sur un pont de Loire au coucher du soleil",
      position: "50% 52%",
    },
  },
  {
    slug: "foret-orleans",
    filter: "half-day",
    title: "Forêt d’Orléans",
    duration: "2h-3h",
    distance: "90-115 km",
    level: "Facile+",
    motorcycle: "Roadster A2 ou trail léger",
    summary: "Routes calmes, forêt, vraie respiration nature.",
    detail:
      "Un tracé plus posé vers Ingrannes et Chamerolles, pensé pour rouler sans se presser entre clairières, villages et grandes lignes boisées.",
    steps: ["Chécy", "Ingrannes", "Chamerolles", "Neuville-aux-Bois"],
    image: {
      src: "/baniere/foret-1536.webp",
      alt: "Trail moto roulant sur une route forestière",
      position: "50% 50%",
    },
  },
  {
    slug: "chateaux-ouest",
    filter: "half-day",
    title: "Châteaux de Loire Ouest",
    duration: "2h30-3h30",
    distance: "80-105 km",
    level: "Facile",
    motorcycle: "A2 ou touring",
    summary: "Patrimoine, Loire, petites villes et pauses faciles.",
    detail:
      "Une sortie lisible vers Meung-sur-Loire et Beaugency, avec assez de route pour profiter sans transformer la journée en marathon.",
    steps: ["Meung-sur-Loire", "Beaugency", "Cléry-Saint-André", "Olivet"],
    image: {
      src: "/baniere/chateaux-1536.webp",
      alt: "Moto touring stationnée devant un château de Loire",
      position: "50% 54%",
    },
  },
  {
    slug: "sully-saint-benoit",
    filter: "day",
    title: "Sully & Saint-Benoît",
    duration: "Demi-journée longue",
    distance: "110-140 km",
    level: "Intermédiaire",
    motorcycle: "Trail, roadster confortable ou touring",
    summary: "Sortie plus complète, Loire Est, château et abbaye.",
    detail:
      "La boucle la plus ample de la sélection, avec un vrai rythme de journée entre Jargeau, Châteauneuf-sur-Loire, Saint-Benoît-sur-Loire et Sully-sur-Loire.",
    steps: [
      "Jargeau",
      "Châteauneuf-sur-Loire",
      "Saint-Benoît-sur-Loire",
      "Sully-sur-Loire",
    ],
    image: {
      src: "/baniere/sully-1536.webp",
      alt: "Moto ancienne devant le château de Sully-sur-Loire",
      position: "50% 53%",
    },
  },
];

export default function MotoDestinations() {
  const [activeFilter, setActiveFilter] = useState<DurationFilter>("short");
  const [activeSlug, setActiveSlug] = useState(destinationRoutes[0].slug);
  const visibleRoutes = destinationRoutes.filter(
    (route) => route.filter === activeFilter,
  );
  const activeRoute =
    destinationRoutes.find((route) => route.slug === activeSlug) ??
    destinationRoutes[0];

  function selectFilter(filter: DurationFilter) {
    const nextRoute = destinationRoutes.find((route) => route.filter === filter);

    setActiveFilter(filter);
    if (nextRoute) {
      setActiveSlug(nextRoute.slug);
    }
  }

  return (
    <section id="destinations-moto" className="section-shell section-deferred section-deferred-tall overflow-hidden">
      <div className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <header className="max-w-3xl space-y-4">
          <Badge variant="accent" size="sm">
            Départ Orléans
          </Badge>
          <div className="space-y-4">
            <h2 className="section-title">
              Balades moto autour d’Orléans.
            </h2>
            <p className="section-copy">
              Choisissez une sortie selon votre temps, votre permis et votre
              envie de route.
            </p>
          </div>
        </header>

        <div
          className="no-scrollbar inline-flex w-full max-w-full gap-1 overflow-x-auto rounded-pill border border-border/70 bg-surface/78 p-1 shadow-[0_14px_30px_rgba(35,24,17,0.07)] lg:w-auto"
          role="group"
          aria-label="Filtrer les balades par durée"
        >
          {durationFilters.map((filter) => {
            const isActive = filter.value === activeFilter;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectFilter(filter.value)}
                className={cn(
                  "min-w-[8.5rem] rounded-pill px-4 py-2.5 text-left transition-[background-color,border-color,box-shadow,color] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35",
                  isActive
                    ? "bg-foreground text-background shadow-[0_10px_22px_rgba(35,24,17,0.16)]"
                    : "text-foreground/72 hover:bg-surface-elevated hover:text-foreground",
                )}
              >
                <span className="block text-sm font-semibold leading-none">
                  {filter.label}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-[0.7rem] font-semibold uppercase tracking-[0.12em]",
                    isActive ? "text-background/70" : "text-muted-foreground",
                  )}
                >
                  {filter.copy}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(21rem,0.88fr)] lg:items-start lg:gap-7">
        <div className="order-1 lg:order-2 lg:col-start-2">
          <div className="border-y border-border/60">
            {visibleRoutes.map((route, index) => (
              <RouteChoice
                key={route.slug}
                route={route}
                index={index}
                isActive={route.slug === activeSlug}
                onSelect={() => setActiveSlug(route.slug)}
              />
            ))}
          </div>
        </div>

        <div className="order-2 space-y-5 lg:order-2 lg:col-start-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral" size="sm">
              {activeRoute.distance}
            </Badge>
            <Badge variant="outline" size="sm">
              {activeRoute.duration}
            </Badge>
            <Badge variant="outline" size="sm">
              {activeRoute.level}
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="meta-label text-brand-600">Balade idéale</p>
            <h3 className="font-display text-[clamp(1.95rem,8vw,2.65rem)] font-bold leading-[0.98] tracking-[-0.025em] text-foreground text-balance lg:text-[clamp(2rem,3.4vw,3.25rem)] lg:tracking-[-0.05em]">
              {activeRoute.title}
            </h3>
            <p className="body-copy text-muted-foreground">
              {activeRoute.detail}
            </p>
          </div>

          <div className="border-t border-border/60 pt-5">
            <p className="meta-label">Moto conseillée</p>
            <p className="mt-2 text-[1rem] font-semibold leading-6 text-foreground">
              {activeRoute.motorcycle}
            </p>
          </div>
        </div>

        <DestinationVisual
          route={activeRoute}
          className="order-3 lg:order-1 lg:row-span-3"
        />

        <div className="order-4 space-y-5 lg:order-2 lg:col-start-2">
          <RouteSteps route={activeRoute} />

          <ButtonLink
            href={CATALOG_AVAILABILITY_HREF}
            ariaLabel="Voir les motos disponibles pour une balade autour d’Orléans"
            variant="accent"
            size="lg"
            className="min-h-11 w-full"
          >
            Voir les motos disponibles
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function RouteChoice({
  route,
  index,
  isActive,
  onSelect,
}: {
  route: DestinationRoute;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onSelect}
      className={cn(
        "grid w-full grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-b border-border/60 py-4 text-left transition-colors last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto]",
        isActive
          ? "text-foreground"
          : "text-foreground/72 hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
          isActive
            ? "border-brand-600/30 bg-brand-soft text-brand-700"
            : "border-border/70 bg-surface/70 text-muted-foreground",
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <span className="min-w-0 space-y-2">
        <span className="block text-[1.08rem] font-semibold leading-6 text-foreground">
          {route.title}
        </span>
        <span className="block text-sm leading-6 text-muted-foreground">
          {route.summary}
        </span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-brand-600">
          <span>{route.distance}</span>
          <span>{route.level}</span>
        </span>
      </span>

      <span
        className={cn(
          "col-start-2 inline-flex w-fit self-start rounded-control border px-2.5 py-1 text-[0.62rem] font-semibold uppercase leading-none tracking-[0.12em] sm:col-start-auto",
          isActive
            ? "border-brand-600/20 bg-brand-soft text-brand-700"
            : "border-border/60 bg-transparent text-muted-foreground",
        )}
      >
        {isActive ? "Sélection" : route.duration}
      </span>
    </button>
  );
}

function DestinationVisual({
  route,
  className,
}: {
  route: DestinationRoute;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[16/11] overflow-hidden rounded-card border border-border/60 bg-surface shadow-[0_18px_38px_rgba(35,24,17,0.08)] lg:aspect-auto lg:min-h-[40rem] lg:shadow-[0_20px_48px_rgba(35,24,17,0.10)]",
        className,
      )}
    >
      <Image
        src={route.image.src}
        alt={route.image.alt}
        fill
        quality={78}
        sizes="(max-width: 1024px) 100vw, 34rem"
        className="object-cover"
        style={{ objectPosition: route.image.position }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,14,0.00)_0%,rgba(20,17,14,0.04)_48%,rgba(20,17,14,0.18)_100%)] lg:bg-[linear-gradient(180deg,rgba(20,17,14,0.02)_0%,rgba(20,17,14,0.10)_42%,rgba(20,17,14,0.74)_100%)]"
      />

      <div className="absolute left-4 right-4 top-4 hidden flex-wrap gap-2 lg:flex">
        <span className="rounded-pill border border-white/24 bg-white/18 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_18px_rgba(20,17,14,0.18)] backdrop-blur-md">
          {route.distance}
        </span>
        <span className="rounded-pill border border-white/24 bg-white/18 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_18px_rgba(20,17,14,0.18)] backdrop-blur-md">
          {route.duration}
        </span>
        <span className="rounded-pill border border-white/24 bg-white/18 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_18px_rgba(20,17,14,0.18)] backdrop-blur-md">
          {route.level}
        </span>
      </div>

      <div className="absolute inset-x-5 bottom-5 hidden max-w-[34rem] space-y-3 text-white sm:inset-x-7 sm:bottom-7 lg:block">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/74">
          Parcours sélectionné
        </p>
        <h3 className="font-display text-[clamp(2rem,4vw,3.7rem)] font-bold leading-[0.96] text-white text-balance">
          {route.title}
        </h3>
        <p className="max-w-[29rem] text-[0.98rem] leading-7 text-white/78">
          {route.summary}
        </p>
      </div>
    </div>
  );
}

function RouteSteps({ route }: { route: DestinationRoute }) {
  return (
    <div className="border-t border-border/60 pt-5">
      <p className="meta-label">Étapes</p>
      <ol
        className="mt-4 grid gap-3 sm:grid-cols-2"
        aria-label={`Étapes ${route.title}`}
      >
        {route.steps.map((step, index) => (
          <li
            key={step}
            className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3"
          >
            {index < route.steps.length - 1 ? (
              <span
                aria-hidden
                className="absolute left-[0.875rem] top-7 h-[calc(100%-0.25rem)] w-px bg-border/80 sm:hidden"
              />
            ) : null}
            <span className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand-600/20 bg-brand-soft text-[0.7rem] font-semibold text-brand-700">
              {index + 1}
            </span>
            <span className="pt-1 text-sm font-semibold leading-5 text-foreground">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
