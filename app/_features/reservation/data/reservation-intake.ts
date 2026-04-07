import type { MotorcycleLicenseCategory } from "@/app/_features/catalog/data/motorcycles";

export type ReservationPreferredContact = "whatsapp" | "phone" | "email";
export type ReservationDocumentType = "none" | "identity-card" | "passport" | "driving-license";

export type ReservationClientDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  preferredContact: ReservationPreferredContact;
  permitType: "none" | "B" | "A1" | "A2" | "A";
  permitNumber: string;
  documentType: ReservationDocumentType;
  documentNumber: string;
  notes: string;
  consentDataUse: boolean;
};

export type ReservationClientChecklistItem = {
  label: string;
  note?: string;
  complete: boolean;
  required: boolean;
};

export type ReservationClientValidationErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "preferredContact"
    | "permitType"
    | "consentDataUse"
    | "documentNumber",
    string
  >
>;

export type ReservationClientValidation = {
  readyForReview: boolean;
  readinessTone: "neutral" | "warning" | "success";
  readinessLabel: string;
  requiredCompleteCount: number;
  requiredCount: number;
  optionalCompleteCount: number;
  optionalCount: number;
  missingRequiredLabels: ReadonlyArray<string>;
  permitCompatibilityMessage: string | null;
  errors: ReservationClientValidationErrors;
};

export const RESERVATION_PREFERRED_CONTACT_OPTIONS: ReadonlyArray<{
  value: ReservationPreferredContact;
  label: string;
}> = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Appel" },
  { value: "email", label: "Email" },
];

export const RESERVATION_DOCUMENT_OPTIONS: ReadonlyArray<{
  value: Exclude<ReservationDocumentType, "none">;
  label: string;
}> = [
  { value: "identity-card", label: "Carte d’identité" },
  { value: "passport", label: "Passeport" },
  { value: "driving-license", label: "Permis de conduire" },
];

const STORAGE_KEY = "allo-moto.reservation.client-draft";

export function createEmptyReservationClientDraft(): ReservationClientDraft {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    preferredContact: "whatsapp",
    permitType: "none",
    permitNumber: "",
    documentType: "none",
    documentNumber: "",
    notes: "",
    consentDataUse: false,
  };
}

export function loadReservationClientDraft(): ReservationClientDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ReservationClientDraft>;
    return normalizeReservationClientDraft(parsed);
  } catch {
    return null;
  }
}

export function saveReservationClientDraft(draft: ReservationClientDraft | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!draft) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function validateReservationClientDraft(
  draft: ReservationClientDraft,
  requiredPermit?: MotorcycleLicenseCategory | null,
): ReservationClientValidation {
  const checklist = buildReservationClientChecklist(draft);
  const requiredItems = checklist.filter((item) => item.required);
  const optionalItems = checklist.filter((item) => !item.required);
  const missingRequiredLabels = requiredItems.filter((item) => !item.complete).map((item) => item.label);

  const errors: ReservationClientValidationErrors = {};
  let permitCompatibilityMessage: string | null = null;

  if (!draft.firstName.trim()) {
    errors.firstName = "Prénom requis.";
  }
  if (!draft.lastName.trim()) {
    errors.lastName = "Nom requis.";
  }
  if (!draft.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
    errors.email = "Email valide requis.";
  }
  if (!draft.phone.trim()) {
    errors.phone = "Téléphone requis.";
  }
  if (!draft.preferredContact) {
    errors.preferredContact = "Préférence requise.";
  }
  if (draft.permitType === "none") {
    errors.permitType = "Type de permis requis.";
  } else if (
    requiredPermit &&
    !isReservationPermitCompatible(requiredPermit, draft.permitType)
  ) {
    errors.permitType = `Cette moto demande le permis ${requiredPermit}.`;
    permitCompatibilityMessage = `${errors.permitType} Choisissez un permis compatible ou revenez aux motos.`;
  }
  if (!draft.consentDataUse) {
    errors.consentDataUse = "Consentement requis.";
  }
  if (draft.documentType !== "none" && draft.documentNumber.trim().length === 0) {
    errors.documentNumber = "Référence du document requise.";
  }

  const readyForReview = Object.keys(errors).length === 0;

  return {
    readyForReview,
    readinessTone: readyForReview
      ? "success"
      : permitCompatibilityMessage || missingRequiredLabels.length > 2
        ? "warning"
        : "neutral",
    readinessLabel: readyForReview
      ? "Prêt"
      : permitCompatibilityMessage
        ? "Permis incompatible"
        : `${missingRequiredLabels.length} à compléter`,
    requiredCompleteCount: requiredItems.filter((item) => item.complete).length,
    requiredCount: requiredItems.length,
    optionalCompleteCount: optionalItems.filter((item) => item.complete).length,
    optionalCount: optionalItems.length,
    missingRequiredLabels,
    permitCompatibilityMessage,
    errors,
  };
}

export function buildReservationClientChecklist(draft: ReservationClientDraft): ReadonlyArray<ReservationClientChecklistItem> {
  return [
    { label: "Prénom", note: "Votre identité.", complete: Boolean(draft.firstName.trim()), required: true },
    { label: "Nom", note: "Le nom du dossier.", complete: Boolean(draft.lastName.trim()), required: true },
    { label: "Email", note: "Pour le suivi.", complete: Boolean(draft.email.trim()), required: true },
    { label: "Téléphone", note: "Le numéro joignable.", complete: Boolean(draft.phone.trim()), required: true },
    {
      label: "Préférence de contact",
      note: "Le canal le plus simple.",
      complete: Boolean(draft.preferredContact),
      required: true,
    },
    {
      label: "Type de permis",
      note: "Pour préparer la suite.",
      complete: draft.permitType !== "none",
      required: true,
    },
    {
      label: "Consentement données",
      note: "Utilisé uniquement pour préparer la réservation.",
      complete: draft.consentDataUse,
      required: true,
    },
    {
      label: "Pays ou nationalité",
      note: "Optionnel.",
      complete: Boolean(draft.country.trim()),
      required: false,
    },
    {
      label: "Numéro de permis",
      note: "Si utile pour le dossier.",
      complete: Boolean(draft.permitNumber.trim()),
      required: false,
    },
    {
      label: "Type de document",
      note: "Optionnel.",
      complete: draft.documentType !== "none",
      required: false,
    },
    {
      label: "Référence du document",
      note: "Si besoin.",
      complete: Boolean(draft.documentNumber.trim()),
      required: false,
    },
    {
      label: "Notes utiles",
      note: "Commentaires ou contraintes.",
      complete: Boolean(draft.notes.trim()),
      required: false,
    },
  ];
}

function normalizeReservationClientDraft(value: Partial<ReservationClientDraft>): ReservationClientDraft {
  const draft = createEmptyReservationClientDraft();
  return {
    ...draft,
    ...value,
    preferredContact:
      value.preferredContact === "phone" || value.preferredContact === "email" || value.preferredContact === "whatsapp"
        ? value.preferredContact
        : draft.preferredContact,
    permitType:
      value.permitType === "B" || value.permitType === "A1" || value.permitType === "A2" || value.permitType === "A"
        ? value.permitType
        : draft.permitType,
    documentType:
      value.documentType === "identity-card" || value.documentType === "passport" || value.documentType === "driving-license"
        ? value.documentType
        : draft.documentType,
    consentDataUse: Boolean(value.consentDataUse),
  };
}

function isReservationPermitCompatible(
  requiredPermit: MotorcycleLicenseCategory,
  permitType: ReservationClientDraft["permitType"],
) {
  if (permitType === "none") {
    return false;
  }

  switch (requiredPermit) {
    case "B":
      return permitType === "B" || permitType === "A1" || permitType === "A2" || permitType === "A";
    case "A1":
      return permitType === "A1" || permitType === "A2" || permitType === "A";
    case "A2":
      return permitType === "A2" || permitType === "A";
    case "A":
      return permitType === "A";
    default:
      return false;
  }
}
