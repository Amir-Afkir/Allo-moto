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
      <div className="relative isolate h-[100svh] overflow-hidden bg-[#f6efe6]">
        <Image
          src="/baniere/baniere.png"
          alt="Motard roulant au coucher du soleil"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[56%_50%]"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(252,247,240,0.92)_0%,rgba(252,247,240,0.82)_19%,rgba(252,247,240,0.42)_38%,rgba(252,247,240,0.12)_60%,rgba(252,247,240,0)_76%),linear-gradient(180deg,rgba(255,248,242,0.05)_0%,rgba(255,248,242,0.015)_36%,rgba(72,44,24,0.04)_100%)]"
        />

        <div className="relative z-10 h-full">
          <div className="app-shell flex h-full flex-col">
            <div className="flex flex-1 items-start">
              <div className="mt-2 flex h-full max-w-[52rem] flex-col justify-start pb-[clamp(6rem,13vh,8.5rem)] pt-36 sm:mt-3 sm:pb-[clamp(6rem,11vh,7.5rem)] sm:pt-28 lg:mt-10 lg:pb-[clamp(6rem,10vh,7rem)] lg:pt-24">
                <div className="max-w-[46rem] sm:max-w-[48rem] lg:max-w-[52rem]">
                  <h1 className="font-body text-[clamp(2.75rem,5.8vw,4.9rem)] font-extrabold leading-[0.92] tracking-[-0.06em] text-[#221915] text-balance">
                    <span className="block whitespace-nowrap">
                      Louez votre moto
                    </span>
                    <span className="block whitespace-nowrap">
                      en quelques minutes.
                    </span>
                  </h1>
                  <p className="mt-4 max-w-[30rem] text-[1rem] leading-[1.6] text-[#6c5b4f] sm:max-w-[34rem] sm:text-[1.08rem]">
                    Définissez votre créneau, comparez les motos vraiment
                    réservables, puis finalisez le dossier.
                  </p>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink
                    href={CATALOG_AVAILABILITY_HREF}
                    ariaLabel="Voir les disponibilités et comparer les motos"
                    variant="accent"
                    size="lg"
                  >
                    Voir les disponibilités
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/25 bg-[linear-gradient(180deg,rgba(250,244,236,0.98)_0%,rgba(247,242,233,0.98)_100%)] py-5 backdrop-blur-[2px] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(250,244,236,0.12)_0%,rgba(247,242,233,0.06)_100%)] sm:py-6 lg:py-7">
            <div className="app-shell flex flex-col gap-4">
              <div className="max-w-[62rem] space-y-2">
                <h2 className="font-body text-[clamp(1.45rem,2.4vw,2.35rem)] leading-[0.98] tracking-[-0.055em] text-foreground text-balance lg:whitespace-nowrap">
                  <span className="font-extrabold">
                    Définissez le bon créneau,
                  </span>{" "}
                  <span className="font-normal">puis choisissez la bonne moto.</span>
                </h2>
                <p className="text-[1rem] leading-[1.6] text-muted-foreground sm:text-[1.05rem]">
                  Allo Moto — Louer devient évident.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
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
