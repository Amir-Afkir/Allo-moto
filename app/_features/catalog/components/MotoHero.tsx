import Image from "next/image";
import { CATALOG_AVAILABILITY_HREF } from "@/app/_shared/lib/navigation";
import { ButtonLink } from "@/app/_shared/ui/ButtonLink";

const heroHighlights = [
  "Prix clair",
  "Dépôt annoncé",
  "Support réactif",
] as const;

export default function MotoHero() {
  return (
    <section id="hero" className="w-full pt-0">
      <div className="relative isolate h-[calc(84svh-var(--chrome-offset))] min-h-[31rem] max-h-[38rem] overflow-hidden bg-[#f6efe6] sm:h-[calc(100svh-var(--chrome-offset))] sm:min-h-[38rem] sm:max-h-none lg:h-[100svh]">
        <Image
          src="/baniere/baniere-2560.webp"
          alt="Motard roulant au coucher du soleil"
          fill
          priority
          quality={82}
          sizes="100vw"
          className="object-cover object-[44%_50%] sm:object-[58%_50%] lg:object-[56%_50%]"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(252,247,240,0.56)_0%,rgba(252,247,240,0.22)_38%,rgba(252,247,240,0.02)_58%,rgba(36,24,17,0.52)_100%),linear-gradient(90deg,rgba(252,247,240,0.78)_0%,rgba(252,247,240,0.24)_52%,rgba(252,247,240,0)_82%)] lg:bg-[linear-gradient(90deg,rgba(252,247,240,0.92)_0%,rgba(252,247,240,0.82)_19%,rgba(252,247,240,0.42)_38%,rgba(252,247,240,0.12)_60%,rgba(252,247,240,0)_76%),linear-gradient(180deg,rgba(255,248,242,0.05)_0%,rgba(255,248,242,0.015)_36%,rgba(72,44,24,0.04)_100%)]"
        />

        <div className="relative z-10 h-full">
          <div className="app-shell flex h-full flex-col">
            <div className="flex flex-1 items-start">
              <div className="mt-0 flex h-full max-w-[52rem] flex-col justify-start pb-8 pt-[calc(var(--chrome-offset)+1.25rem)] sm:mt-3 sm:pb-[clamp(6rem,11vh,7.5rem)] sm:pt-28 lg:mt-10 lg:pb-[clamp(6rem,10vh,7rem)] lg:pt-24">
                <div className="max-w-[46rem] sm:max-w-[48rem] lg:max-w-[52rem]">
                  <h1 className="font-body text-[clamp(2.18rem,10.5vw,3.08rem)] font-extrabold leading-[0.98] tracking-[-0.02em] text-[#221915] text-balance drop-shadow-[0_1px_18px_rgba(252,247,240,0.62)] sm:text-[clamp(2.75rem,5.8vw,4.9rem)] sm:leading-[0.92] sm:tracking-[-0.06em] sm:drop-shadow-none">
                    <span className="block">Louez votre moto</span>
                    <span className="block">à Orléans.</span>
                  </h1>
                  <p className="mt-3 max-w-[22rem] text-[0.98rem] leading-[1.6] text-[#5f5048] sm:hidden">
                    Créneau, modèle, dossier : tout est guidé.
                  </p>
                  <p className="mt-4 hidden max-w-[34rem] text-[1.08rem] leading-[1.6] text-[#6c5b4f] sm:block">
                    Créneau, modèle, dossier : tout est guidé avant votre
                    départ d’Orléans.
                  </p>
                </div>

                <div className="mt-7 flex flex-col items-start gap-2.5 sm:flex-row sm:gap-3">
                  <ButtonLink
                    href={CATALOG_AVAILABILITY_HREF}
                    prefetch
                    ariaLabel="Voir les disponibilités et comparer les motos"
                    variant="accent"
                    size="lg"
                    className="min-h-11 w-full max-w-[18.75rem] sm:w-auto sm:max-w-none"
                  >
                    Voir les disponibilités
                  </ButtonLink>
                  <p className="inline-flex max-w-full items-center whitespace-nowrap rounded-full border border-white/45 bg-[#fff8ef]/62 px-3 py-1 text-[0.74rem] leading-5 font-semibold tracking-[0.01em] text-[#5f3f2c] shadow-[0_8px_18px_rgba(35,24,17,0.08)] backdrop-blur-[2px] sm:hidden">
                    Prix clair · Dépôt annoncé · Support
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 hidden border-t border-white/25 bg-[linear-gradient(180deg,rgba(250,244,236,0.82)_0%,rgba(247,242,233,0.90)_100%)] py-6 backdrop-blur-[2px] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(250,244,236,0.12)_0%,rgba(247,242,233,0.06)_100%)] sm:block lg:py-7">
            <div className="app-shell flex flex-col gap-0 sm:gap-4">
              <div className="hidden max-w-[62rem] space-y-2 sm:block">
                <h2 className="font-body text-[clamp(1.25rem,6vw,1.65rem)] leading-[1.02] tracking-[-0.035em] text-foreground text-balance sm:text-[clamp(1.45rem,2.4vw,2.35rem)] sm:leading-[0.98] sm:tracking-[-0.055em] lg:whitespace-nowrap">
                  <span>
                    <span className="font-extrabold">Depuis Orléans,</span>{" "}
                    <span className="font-normal">
                      choisissez le bon créneau, puis la bonne moto.
                    </span>
                  </span>
                </h2>
                <p className="text-[1rem] leading-[1.6] text-muted-foreground sm:text-[1.05rem]">
                  Loire, forêt d’Orléans, châteaux : la sortie se prépare
                  avant le départ.
                </p>
              </div>

              <div className="hidden flex-wrap gap-2 sm:flex sm:gap-3">
                {heroHighlights.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center rounded-full border border-[#e4d6c8] bg-[#f4ede2] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#8f684d] dark:border-border/70 dark:bg-surface/80 dark:text-muted-foreground"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
