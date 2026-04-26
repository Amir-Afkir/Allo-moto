import Image from "next/image";

const steps = [
  {
    no: "01",
    title: "Définir le créneau",
    copy: "Dates, retrait et permis cadrent d’abord la réservation.",
  },
  {
    no: "02",
    title: "Choisir la bonne moto",
    copy: "Le catalogue compare ensuite seulement les modèles cohérents pour ce créneau.",
  },
  {
    no: "03",
    title: "Finaliser le dossier",
    copy: "Le dossier s’ouvre après le choix, puis l’envoi vient en dernier.",
  },
] as const;

export default function MotoProcess() {
  return (
    <section
      id="journey"
      className="section-deferred section-deferred-tall relative isolate w-full overflow-hidden bg-[#f7f2e9]"
    >
      <div className="relative min-h-[36rem] sm:min-h-[40rem] lg:min-h-[44rem]">
        <Image
          src="/baniere/process-2560.webp"
          alt="Remise de clé de moto"
          fill
          quality={78}
          sizes="100vw"
          className="object-cover object-[52%_52%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(248,242,234,0.84)_0%,rgba(248,242,234,0.7)_18%,rgba(248,242,234,0.24)_42%,rgba(248,242,234,0.08)_64%,rgba(248,242,234,0.02)_78%,rgba(248,242,234,0)_100%),linear-gradient(180deg,rgba(20,17,14,0.015)_0%,rgba(20,17,14,0.05)_100%)]"
        />
        <div className="app-shell relative z-10 flex min-h-[inherit] flex-col py-6 sm:py-8 lg:py-12">
          <div className="max-w-[42rem] pt-4 lg:pt-6">
            <h2 className="heading-2 text-foreground text-balance">
              Réserver sans détour.
            </h2>
            <p className="mt-4 max-w-[28rem] body-copy text-muted-foreground">
              Créneau, moto, dossier, envoi. Chaque étape arrive au bon moment.
            </p>
          </div>

          <div className="mt-8 w-full max-w-[30rem] sm:mt-12">
            <div className="surface-elevated border border-border/60 bg-[rgba(255,248,240,0.86)] p-6 shadow-[0_18px_40px_rgba(26,20,15,0.08)] backdrop-blur-sm sm:p-8">
              <div className="space-y-4">
                {steps.map((step) => (
                  <div key={step.no} className="timeline-step">
                    <div className="label">Étape {step.no}</div>
                    <h3 className="mt-4 heading-3 text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-[24rem] body-copy text-muted-foreground">
                      {step.copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
