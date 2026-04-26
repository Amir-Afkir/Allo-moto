import Section from "@/app/_shared/components/Section";
import ReadinessFaq from "./ReadinessFaq";

const faqItems = [
  {
    question: "Le casque est-il inclus ?",
    answer:
      "Un prêt peut être proposé selon disponibilité. La taille doit être confirmée avant le retrait.",
  },
  {
    question: "Les gants sont-ils obligatoires ?",
    answer:
      "Oui, des gants homologués sont nécessaires pour circuler à moto ou scooter.",
  },
  {
    question: "Comment savoir si mon permis suffit ?",
    answer:
      "Chaque moto affiche le permis requis. Le dossier est vérifié avant confirmation.",
  },
  {
    question: "Que dois-je apporter au retrait ?",
    answer:
      "Permis, pièce d’identité, moyen de paiement, dépôt et équipement personnel si vous l’utilisez.",
  },
] as const;

export default function MotoFaq() {
  return (
    <Section
      id="faq"
      title="Questions fréquentes."
      subtitle="Les réponses courtes avant de demander de l’aide."
      density="compact"
      className="section-deferred"
    >
      <div className="max-w-4xl">
        <ReadinessFaq items={faqItems} />
      </div>
    </Section>
  );
}
