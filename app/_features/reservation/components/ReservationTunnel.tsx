"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MotoRetenueSidebar } from "@/app/_features/catalog/components/MotoRetenueSidebar";
import {
  MOTORCYCLE_STATUS_META,
  type CatalogMotorcycle,
} from "@/app/_features/catalog/data/motorcycles";
import {
  buildReservationSearchParams,
  calculateReservationDuration,
  evaluateReservation,
  formatDateInputValue,
  formatDateRange,
  parseReservationPickupMode,
  PICKUP_MODE_OPTIONS,
  type PermitSelection,
  type ReservationPickupMode,
  type ReservationStage,
} from "@/app/_features/reservation/data/reservation";
import {
  buildReservationConfirmationSnapshot,
  createReservationConfirmationRecord,
  clearReservationConfirmationRecord,
  loadReservationConfirmationRecord,
  saveReservationConfirmationRecord,
  type ReservationConfirmationRecord,
  type ReservationConfirmationSnapshot,
} from "@/app/_features/reservation/data/reservation-confirmation";
import { usePlanningLedger } from "@/app/_features/reservation/hooks/usePlanningLedger";
import {
  findPlanningReservation,
  type PlanningAvailabilityBlock,
  type PlanningReservationRecord,
  upsertPlanningReservation,
} from "@/app/_features/reservation/data/reservation-planning";
import {
  createEmptyReservationClientDraft,
  loadReservationClientDraft,
  saveReservationClientDraft,
  validateReservationClientDraft,
  type ReservationClientDraft,
  type ReservationClientValidation,
} from "@/app/_features/reservation/data/reservation-intake";
import { cn } from "@/app/_shared/lib/cn";
import { Badge } from "@/app/_shared/ui/Badge";
import { Button } from "@/app/_shared/ui/Button";
import { EmptyState } from "@/app/_shared/ui/EmptyState";
import { Input } from "@/app/_shared/ui/Input";
import { Label } from "@/app/_shared/ui/Label";
import { ReservationClientDossier } from "./ReservationClientDossier";

const ReservationPayment = dynamic(
  () =>
    import("./ReservationPayment").then((module) => module.ReservationPayment),
  {
    loading: () => <ReservationStageLoading stage="send" />,
  },
);

const ReservationConfirmation = dynamic(
  () =>
    import("./ReservationConfirmation").then(
      (module) => module.ReservationConfirmation,
    ),
  {
    loading: () => <ReservationStageLoading stage="followup" />,
  },
);

type ReservationTunnelProps = {
  motorcycles: readonly CatalogMotorcycle[];
  initialPlanningReservations: ReadonlyArray<PlanningReservationRecord>;
  initialPlanningBlocks: ReadonlyArray<PlanningAvailabilityBlock>;
  initialMotorcycleSlug: string;
  invalidRequestedMotorcycleSlug: string | null;
  initialPickupDate: string;
  initialReturnDate: string;
  initialPickupMode: ReservationPickupMode;
  initialPermit: PermitSelection;
  initialStage: ReservationStage;
};

export function ReservationTunnel({
  motorcycles,
  initialPlanningReservations,
  initialPlanningBlocks,
  initialMotorcycleSlug,
  invalidRequestedMotorcycleSlug,
  initialPickupDate,
  initialReturnDate,
  initialPickupMode,
  initialStage,
}: ReservationTunnelProps) {
  const [motorcycleSlug, setMotorcycleSlug] = useState(initialMotorcycleSlug);
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [pickupMode, setPickupMode] =
    useState<ReservationPickupMode>(initialPickupMode);
  const permit: PermitSelection = "none";
  const [viewStage, setViewStage] = useState<ReservationStage>(initialStage);
  const [hasChecked, setHasChecked] = useState(initialStage !== "selection");
  const [clientDraft, setClientDraft] = useState<ReservationClientDraft>(
    createEmptyReservationClientDraft(),
  );
  const [clientDraftLoaded, setClientDraftLoaded] = useState(false);
  const [clientDraftRestored, setClientDraftRestored] = useState(false);
  const [clientDraftTouched, setClientDraftTouched] = useState(false);
  const [showPreparation, setShowPreparation] = useState(false);
  const [confirmationRecord, setConfirmationRecord] =
    useState<ReservationConfirmationRecord | null>(null);
  const [confirmationRecordLoaded, setConfirmationRecordLoaded] =
    useState(false);
  const [currentReservationId, setCurrentReservationId] = useState<string | null>(
    null,
  );
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [planningFeedback, setPlanningFeedback] = useState<string | null>(null);
  const [liveNotice, setLiveNotice] = useState("");
  const [liveAlert, setLiveAlert] = useState("");
  const [planningDraft, setPlanningDraft] = useState<{
    pickupDate: string;
    returnDate: string;
    pickupMode: ReservationPickupMode;
  }>({
    pickupDate: initialPickupDate,
    returnDate: initialReturnDate,
    pickupMode: initialPickupMode,
  });
  const {
    reservations: planningReservations,
    blocks: planningBlocks,
    setReservations: setPlanningReservations,
  } = usePlanningLedger({
    reservations: initialPlanningReservations,
    blocks: initialPlanningBlocks,
  });
  const planningReturnFocusRef = useRef<HTMLElement | null>(null);

  const selectedMotorcycle = useMemo(
    () =>
      motorcycles.find((motorcycle) => motorcycle.slug === motorcycleSlug) ??
      null,
    [motorcycleSlug, motorcycles],
  );

  const draft = useMemo(
    () => ({
      motorcycleSlug,
      pickupDate,
      returnDate,
      pickupMode,
      permit,
    }),
    [motorcycleSlug, pickupDate, returnDate, pickupMode, permit],
  );

  const evaluation = useMemo(
    () =>
      evaluateReservation({
        motorcycle: selectedMotorcycle,
        draft,
        planningReservations,
        planningBlocks,
        ignoreReservationId: currentReservationId,
      }),
    [
      currentReservationId,
      draft,
      planningBlocks,
      planningReservations,
      selectedMotorcycle,
    ],
  );
  const clientValidation = useMemo(
    () =>
      validateReservationClientDraft(
        clientDraft,
        selectedMotorcycle?.licenseCategory ?? null,
      ),
    [clientDraft, selectedMotorcycle],
  );
  const resolvedConfirmationRecord = useMemo(
    () => {
      if (!confirmationRecord && !currentReservationId) {
        return null;
      }

      return createReservationConfirmationRecord({
        motorcycle: selectedMotorcycle,
        draft,
        clientDraft,
        clientValidation,
        evaluation,
        planningReservation: findPlanningReservation(
          planningReservations,
          currentReservationId,
        ),
        existingRecord: confirmationRecord,
      });
    },
    [
      clientDraft,
      clientValidation,
      confirmationRecord,
      currentReservationId,
      draft,
      evaluation,
      planningReservations,
      selectedMotorcycle,
    ],
  );
  const confirmationSnapshot: ReservationConfirmationSnapshot = useMemo(
    () =>
      buildReservationConfirmationSnapshot({
        motorcycle: selectedMotorcycle,
        draft,
        clientDraft,
        clientValidation,
        evaluation,
        planningReservation: findPlanningReservation(
          planningReservations,
          currentReservationId,
        ),
        confirmationRecord: resolvedConfirmationRecord,
      }),
    [
      clientDraft,
      clientValidation,
      currentReservationId,
      draft,
      evaluation,
      planningReservations,
      resolvedConfirmationRecord,
      selectedMotorcycle,
    ],
  );

  const durationDays = calculateReservationDuration(pickupDate, returnDate);
  const isReady = evaluation.available;
  const readyForPreparation = isReady && clientValidation.readyForReview;
  const buildStageHref = (stage: ReservationStage, anchor?: string) => {
    const search = buildReservationSearchParams({
      motorcycleSlug: selectedMotorcycle?.slug ?? null,
      pickupDate,
      returnDate,
      pickupMode,
      permit,
      stage,
    });

    return `/reserver?${search}${anchor ? `#${anchor}` : ""}`;
  };
  const selectionFormHref = buildStageHref("selection", "reservation-form");
  const clientFormHref = buildStageHref("client", "client-form");
  const clientStageHref = buildStageHref("client");
  const paymentFormHref = buildStageHref("payment", "send-form");
  const paymentStageHref = buildStageHref("payment");
  const confirmationStageHref = buildStageHref("confirmed", "confirmation");
  const selectionStageHref = buildStageHref("selection");
  const hasActiveHold = Boolean(currentReservationId);
  const sidebarFooterNote =
    viewStage === "payment" || viewStage === "client" || viewStage === "confirmed"
      ? `${formatDateRange(pickupDate, returnDate)} • ${evaluation.pickupLabel}`
      : evaluation.available
        ? `${formatDateRange(pickupDate, returnDate)} • ${evaluation.pickupLabel}`
        : evaluation.blockers[0] ??
          evaluation.nextAvailableLabel ??
          "Créneau à vérifier.";
  const reservationSidebarAction = getReservationSidebarAction({
    viewStage,
    hasChecked,
    isReady,
    readyForPreparation,
    paymentReady: confirmationSnapshot.state === "pending_validation",
    confirmationReady: confirmationSnapshot.state === "confirmed",
    selectionHref: selectionFormHref,
    clientHref: clientFormHref,
    paymentHref: paymentFormHref,
    confirmationHref: confirmationStageHref,
    catalogHref: "/motos",
  });
  const reservationSurface = getReservationSurfaceContext({
    viewStage,
    hasChecked,
    isReady,
    readyForPreparation,
    hasSelectedMotorcycle: Boolean(selectedMotorcycle),
    paymentReady: confirmationSnapshot.state === "pending_validation",
    confirmationReady: confirmationSnapshot.state === "confirmed",
    selectionHref: selectionStageHref,
    catalogHref: "/motos",
  });
  const mobileHeaderCopy = getMobileReservationHeaderCopy({
    viewStage,
    confirmationReady: confirmationSnapshot.state === "confirmed",
  });
  const selectionAnnouncement = useMemo(() => {
    if (viewStage !== "selection" || !hasChecked || !selectedMotorcycle) {
      return null;
    }

    if (evaluation.available) {
      return "Créneau compatible. Vous pouvez passer au dossier.";
    }

    return (
      evaluation.blockers[0] ??
      evaluation.nextAvailableLabel ??
      "Ce créneau doit être ajusté."
    );
  }, [
    evaluation.available,
    evaluation.blockers,
    evaluation.nextAvailableLabel,
    hasChecked,
    selectedMotorcycle,
    viewStage,
  ]);
  const shouldShowMobileDock = Boolean(selectedMotorcycle) && viewStage === "client";

  useEffect(() => {
    const storedDraft = loadReservationClientDraft();
    if (storedDraft) {
      setClientDraft(storedDraft);
      setClientDraftRestored(true);
    }

    setClientDraftLoaded(true);
  }, []);

  useEffect(() => {
    const storedConfirmation = loadReservationConfirmationRecord();
    if (storedConfirmation) {
      setConfirmationRecord(storedConfirmation);
      if (storedConfirmation.reservationId) {
        setCurrentReservationId(storedConfirmation.reservationId);
      }
    }

    setConfirmationRecordLoaded(true);
  }, []);

  useEffect(() => {
    if (!clientDraftLoaded || !clientDraftTouched) {
      return;
    }

    saveReservationClientDraft(clientDraft);
  }, [clientDraft, clientDraftLoaded, clientDraftTouched]);

  useEffect(() => {
    if (!confirmationRecordLoaded) {
      return;
    }

    saveReservationConfirmationRecord(resolvedConfirmationRecord);
  }, [confirmationRecordLoaded, resolvedConfirmationRecord]);

  useEffect(() => {
    if (!currentReservationId) {
      return;
    }

    const currentReservation = findPlanningReservation(
      planningReservations,
      currentReservationId,
    );

    if (
      !currentReservation ||
      currentReservation.reservationStatus === "cancelled" ||
      currentReservation.paymentStatus === "expired"
    ) {
      setCurrentReservationId(null);
    }
  }, [currentReservationId, planningReservations]);

  useEffect(() => {
    setLiveNotice(
      getReservationStageAnnouncement({
        viewStage,
        confirmationReady: confirmationSnapshot.state === "confirmed",
      }),
    );
  }, [confirmationSnapshot.state, viewStage]);

  useEffect(() => {
    if (!planningFeedback) {
      return;
    }

    setLiveNotice(planningFeedback);
  }, [planningFeedback]);

  useEffect(() => {
    if (!selectionAnnouncement) {
      return;
    }

    setLiveNotice(selectionAnnouncement);
  }, [selectionAnnouncement]);

  useEffect(() => {
    if (!submitError) {
      return;
    }

    setLiveAlert(submitError);
  }, [submitError]);

  useEffect(() => {
    if (!invalidRequestedMotorcycleSlug) {
      return;
    }

    setLiveAlert(
      `Le modèle ${invalidRequestedMotorcycleSlug} n'est plus disponible.`,
    );
  }, [invalidRequestedMotorcycleSlug]);

  function clearCurrentReservationContext() {
    if (currentReservationId) {
      setCurrentReservationId(null);
    }
    if (confirmationRecord) {
      setConfirmationRecord(null);
      clearReservationConfirmationRecord();
    }
  }

  function restorePlanningTriggerFocus() {
    if (typeof window === "undefined") {
      return;
    }

    const trigger = planningReturnFocusRef.current;
    if (!trigger) {
      return;
    }

    window.requestAnimationFrame(() => {
      trigger.focus();
    });
  }

  function resetValidation() {
    if (hasChecked) {
      setHasChecked(false);
    }
    if (viewStage !== "selection") {
      setViewStage("selection");
    }
    if (showPreparation) {
      setShowPreparation(false);
    }
    clearCurrentReservationContext();
    if (submitError) {
      setSubmitError(null);
    }
  }

  function handleSelectionChange(nextValue: string) {
    setMotorcycleSlug(nextValue);
    resetValidation();
  }

  function handleDateChange(
    nextSetter: (value: string) => void,
    value: string,
  ) {
    nextSetter(value);
    resetValidation();
  }

  function handleModeChange(value: string) {
    setPickupMode(parseReservationPickupMode(value));
    resetValidation();
  }

  function handleClientDraftChange<K extends keyof ReservationClientDraft>(
    key: K,
    value: ReservationClientDraft[K],
  ) {
    setClientDraft((current) => ({
      ...current,
      [key]: value,
    }));
    setClientDraftTouched(true);
    setClientDraftRestored(false);
    setShowPreparation(false);
    clearCurrentReservationContext();
    if (submitError) {
      setSubmitError(null);
    }
  }

  async function handleSubmitReservation() {
    if (
      !selectedMotorcycle ||
      !evaluation.available ||
      !clientValidation.readyForReview ||
      isSubmittingReservation
    ) {
      return;
    }

    setIsSubmittingReservation(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draft,
          clientDraft,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            message?: string;
            reservation?: PlanningReservationRecord;
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.reservation) {
        setSubmitError(
          payload?.message ??
            "La demande n'a pas pu être envoyée. Réessayez dans un instant.",
        );
        return;
      }

      const pendingReservation = payload.reservation;

      setPlanningReservations((current) =>
        upsertPlanningReservation(current, pendingReservation),
      );
      setCurrentReservationId(pendingReservation.id);
      setConfirmationRecord(
        createReservationConfirmationRecord({
          motorcycle: selectedMotorcycle,
          draft,
          clientDraft,
          clientValidation,
          evaluation,
          planningReservation: pendingReservation,
          existingRecord: confirmationRecord,
        }),
      );
      setHasChecked(true);
      setShowPreparation(false);
      setViewStage("confirmed");
    } catch {
      setSubmitError(
        "La demande n'a pas pu être envoyée. Réessayez dans un instant.",
      );
    } finally {
      setIsSubmittingReservation(false);
    }
  }

  function handlePrepareNextStep() {
    if (!clientValidation.readyForReview) {
      setShowPreparation(true);
      return;
    }

    setViewStage("payment");
    setShowPreparation(true);
    setHasChecked(true);
  }

  function handleSubmit() {
    setPlanningFeedback(null);
    setHasChecked(true);

    if (evaluation.available && selectedMotorcycle) {
      setViewStage("client");
    }
  }

  function openPlanningModal() {
    planningReturnFocusRef.current =
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setPlanningDraft({
      pickupDate,
      returnDate,
      pickupMode,
    });
    setPlanningFeedback(null);
    setIsPlanningModalOpen(true);
  }

  function closePlanningModal() {
    setIsPlanningModalOpen(false);
    restorePlanningTriggerFocus();
  }

  function applyPlanningModal() {
    const hasChanged =
      planningDraft.pickupDate !== pickupDate ||
      planningDraft.returnDate !== returnDate ||
      planningDraft.pickupMode !== pickupMode;

    if (!hasChanged) {
      closePlanningModal();
      return;
    }

    const hadHold = hasActiveHold;

    setPickupDate(planningDraft.pickupDate);
    setReturnDate(planningDraft.returnDate);
    setPickupMode(planningDraft.pickupMode);
    resetValidation();
    setPlanningFeedback(
      hadHold
        ? "Créneau mis à jour. La demande précédente a été libérée."
        : "Créneau mis à jour. Vérifiez la disponibilité.",
    );
    closePlanningModal();
  }

  function handlePrimaryAction() {
    if (viewStage === "selection") {
      handleSubmit();
      return;
    }

    if (viewStage === "client" && typeof window !== "undefined") {
      const form = document.getElementById("client-form");
      if (form instanceof HTMLFormElement) {
        form.requestSubmit();
        return;
      }

      handlePrepareNextStep();
    }
  }

  return (
    <section
      className={cn(
        "w-full pb-16 md:pb-16",
        shouldShowMobileDock &&
          "pb-[calc(8.75rem+env(safe-area-inset-bottom))] md:pb-16",
      )}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveNotice}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {liveAlert}
      </div>

      <div className="mb-4 hidden flex-wrap items-center gap-2 text-sm text-muted-foreground md:flex">
        <Link href="/motos" className="transition-colors hover:text-foreground">
          Motos
        </Link>
        <span>/</span>
        <span className="text-foreground">Réserver</span>
      </div>

      {invalidRequestedMotorcycleSlug ? (
        <div className="section-band mb-6 border-warning/20 bg-warning/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge variant="warning">Moto introuvable</Badge>
              <p className="text-sm text-foreground/78">
                Le modèle{" "}
                <span className="font-semibold text-foreground">
                  {invalidRequestedMotorcycleSlug}
                </span>{" "}
                n’existe plus dans le catalogue. Vous pouvez choisir une autre
                moto ci-dessous.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                as="link"
                href="/motos"
                ariaLabel="Revenir au catalogue"
                variant="accent"
                size="md"
              >
                Revenir au catalogue
              </Button>
              <Button
                as="link"
                href="#reservation-form"
                ariaLabel="Choisir une moto dans le formulaire"
                variant="outline"
                size="md"
              >
                Choisir une moto
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6 md:space-y-8">
          <section className="space-y-4 border-b border-border/60 pb-6 md:space-y-6 md:pb-8">
            <div className="md:hidden">
              <Link
                href="/motos"
                className="label inline-flex items-center gap-2 text-foreground/72 transition-colors hover:text-foreground"
              >
                Retour aux motos
              </Link>
            </div>

            <div className="max-w-3xl space-y-2 md:space-y-3">
              <h1 className="heading-1 text-foreground text-balance">
                <span className="md:hidden">{mobileHeaderCopy.title}</span>
                <span className="hidden md:inline">{reservationSurface.title}</span>
              </h1>
              <p className="max-w-2xl body-copy text-muted-foreground">
                <span className="md:hidden">{mobileHeaderCopy.description}</span>
                <span className="hidden md:inline">
                  {reservationSurface.description}
                </span>
              </p>
            </div>

            <ReservationMobileSummary
              motorcycle={selectedMotorcycle}
              pickupDate={pickupDate}
              returnDate={returnDate}
              pickupMode={pickupMode}
              hasActiveHold={hasActiveHold}
              actions={reservationSurface}
              onEdit={openPlanningModal}
            />

            <div className="hidden md:block">
              <ReservationScheduleStrip
                motorcycle={selectedMotorcycle}
                pickupDate={pickupDate}
                returnDate={returnDate}
                pickupMode={pickupMode}
                hasActiveHold={hasActiveHold}
                onEdit={openPlanningModal}
              />
            </div>

            {planningFeedback ? (
              <p
                className="rounded-card border border-border/60 bg-surface/70 px-4 py-3 text-sm text-muted-foreground"
                role="status"
              >
                {planningFeedback}
              </p>
            ) : null}

            <ReservationStepper
              viewStage={viewStage}
              hasChecked={hasChecked}
              isReady={isReady}
            />
          </section>

          {viewStage === "selection" ? (
            <div
              id="reservation-form"
              className="space-y-5 border-b border-border/60 pb-8 md:space-y-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="label md:hidden">Sélection</p>
                  <h2 className="heading-3 text-foreground">
                    <span className="md:hidden">
                      {selectedMotorcycle
                        ? "Vérifiez votre sélection."
                        : "Choisissez une moto."}
                    </span>
                    <span className="hidden md:inline">
                      {selectedMotorcycle
                        ? `${selectedMotorcycle.brand} ${selectedMotorcycle.model}`
                        : "Choisissez un modèle"}
                    </span>
                  </h2>
                  <p className="body-copy text-muted-foreground">
                    <span className="md:hidden">
                      {selectedMotorcycle
                        ? "Ajustez les dates ou le retrait, puis lancez la vérification."
                        : "Choisissez une moto, vos dates et le retrait pour lancer la vérification."}
                    </span>
                    <span className="hidden md:inline">
                      {selectedMotorcycle
                        ? `${selectedMotorcycle.locationLabel} • Ajustez si besoin, puis lancez la vérification.`
                        : "Choisissez une moto, vos dates et votre retrait pour lancer la vérification."}
                    </span>
                  </p>
                </div>

                {selectedMotorcycle ? (
                  <Badge
                    variant={
                      MOTORCYCLE_STATUS_META[selectedMotorcycle.status].tone
                    }
                  >
                    {MOTORCYCLE_STATUS_META[selectedMotorcycle.status].label}
                  </Badge>
                ) : (
                  <Badge variant="outline">À choisir</Badge>
                )}
              </div>

              {!selectedMotorcycle ? (
                <div className="border-y border-dashed border-border/70 py-5">
                  <EmptyState
                    title="Aucune moto sélectionnée."
                    description="Choisissez un modèle pour lancer la vérification."
                    action={
                      <Button
                        as="link"
                        href="/motos"
                        ariaLabel="Revenir au catalogue pour choisir une moto"
                        variant="accent"
                        size="md"
                      >
                        Ouvrir le catalogue
                      </Button>
                    }
                  />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-1">
                <Field label="Moto" htmlFor="reservation-motorcycle">
                  <select
                    id="reservation-motorcycle"
                    value={motorcycleSlug}
                    onChange={(event) =>
                      handleSelectionChange(event.target.value)
                    }
                    className="input-shell appearance-none pr-10"
                  >
                    <option value="">Choisir une moto</option>
                    {motorcycles.map((motorcycle) => {
                      const statusMeta =
                        MOTORCYCLE_STATUS_META[motorcycle.status];
                      return (
                        <option key={motorcycle.slug} value={motorcycle.slug}>
                          {motorcycle.name} — {statusMeta.label}
                        </option>
                      );
                    })}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Départ" htmlFor="reservation-pickup-date">
                  <Input
                    id="reservation-pickup-date"
                    type="date"
                    value={pickupDate}
                    min={formatDateInputValue(new Date())}
                    onChange={(event) =>
                      handleDateChange(setPickupDate, event.target.value)
                    }
                  />
                </Field>

                <Field label="Retour" htmlFor="reservation-return-date">
                  <Input
                    id="reservation-return-date"
                    type="date"
                    value={returnDate}
                    min={pickupDate || formatDateInputValue(new Date())}
                    onChange={(event) =>
                      handleDateChange(setReturnDate, event.target.value)
                    }
                  />
                </Field>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end">
                <Field
                  label="Point de retrait"
                  htmlFor="reservation-pickup-mode"
                >
                  <select
                    id="reservation-pickup-mode"
                    value={pickupMode}
                    onChange={(event) => handleModeChange(event.target.value)}
                    className="input-shell appearance-none pr-10"
                  >
                    {PICKUP_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid gap-x-6 gap-y-4 border-t border-border/60 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <ReservationKeyFact
                    label="Durée"
                    value={
                      durationDays > 0
                        ? `${durationDays} jour${durationDays > 1 ? "s" : ""}`
                        : "À valider"
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  as="button"
                  type="button"
                  ariaLabel="Vérifier la disponibilité"
                  variant="accent"
                  size="lg"
                  onClick={handleSubmit}
                >
                  Vérifier la disponibilité
                </Button>
                <Link
                  href="/motos"
                  aria-label="Revenir au catalogue de motos"
                  className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-brand transition-colors hover:text-brand-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:justify-start"
                >
                  Revenir au catalogue
                </Link>
              </div>
            </div>
          ) : null}

          {viewStage === "confirmed" ? (
            <ReservationConfirmation
              motorcycle={selectedMotorcycle}
              snapshot={confirmationSnapshot}
              catalogHref="/motos"
              motorcycleHref={
                selectedMotorcycle
                  ? `/motos/${selectedMotorcycle.slug}`
                  : "/motos"
              }
              dossierHref={clientStageHref}
              clientHref={clientStageHref}
              paymentHref={paymentStageHref}
              conditionsHref="/conditions"
            />
          ) : viewStage === "payment" ? (
            <ReservationPayment
              motorcycle={selectedMotorcycle}
              draft={draft}
              clientDraft={clientDraft}
              clientValidation={clientValidation}
              evaluation={evaluation}
              dossierHref={clientStageHref}
              followupHref={confirmationStageHref}
              conditionsHref="/conditions"
              submitError={submitError}
              isSubmitting={isSubmittingReservation}
              onSubmitReservation={handleSubmitReservation}
            />
          ) : viewStage === "client" ? (
            <ReservationClientDossier
              motorcycle={selectedMotorcycle}
              validation={clientValidation}
              draft={clientDraft}
              lastSavedLabel={
                clientDraftRestored && !clientDraftTouched
                  ? "Brouillon restauré"
                  : clientDraftTouched
                    ? "Autosauvegardé"
                    : clientDraftLoaded
                      ? "Autosauvegarde prête"
                      : null
              }
              backHref={selectionStageHref}
              onChange={handleClientDraftChange}
              onPrepareNextStep={handlePrepareNextStep}
            />
          ) : (
            <ReservationResultCard
              hasChecked={hasChecked}
              isReady={isReady}
              evaluation={evaluation}
            />
          )}
        </div>

        <aside className="hidden space-y-5 md:block xl:sticky xl:top-[10rem] xl:self-start">
          {selectedMotorcycle ? (
            <MotoRetenueSidebar
              motorcycle={selectedMotorcycle}
              selectedVisible
              contextLabel={null}
              primaryActionLabel={reservationSidebarAction.label}
              primaryActionHref={reservationSidebarAction.href}
              primaryActionAriaLabel={reservationSidebarAction.ariaLabel}
              footerNote={sidebarFooterNote}
            />
          ) : (
            <div className="section-band panel-space">
              <EmptyState
                title="Aucune moto sélectionnée."
                description={
                  invalidRequestedMotorcycleSlug
                    ? "Le modèle demandé n’est plus publié."
                    : "Choisissez un modèle pour afficher la moto retenue."
                }
                action={
                  <Button
                    as="link"
                    href="/motos"
                    ariaLabel="Ouvrir le catalogue de motos"
                    variant="accent"
                    size="md"
                  >
                    Ouvrir le catalogue
                  </Button>
                }
              />
            </div>
          )}
        </aside>
      </div>
      {shouldShowMobileDock ? (
        <ReservationMobileDock
          motorcycle={selectedMotorcycle}
          actions={reservationSurface}
          pickupDate={pickupDate}
          returnDate={returnDate}
          pickupMode={pickupMode}
          clientValidation={clientValidation}
          clientDraftStatusLabel={
            clientDraftRestored && !clientDraftTouched
              ? "Brouillon restauré"
              : clientDraftTouched
                ? "Autosauvegardé"
                : clientDraftLoaded
                  ? "Autosauvegarde prête"
                  : "Chargement..."
          }
          onPrimaryAction={handlePrimaryAction}
        />
      ) : null}
      {isPlanningModalOpen ? (
        <ReservationPlanningModal
          draft={planningDraft}
          onDraftChange={setPlanningDraft}
          onClose={closePlanningModal}
          onApply={applyPlanningModal}
          hasActiveHold={hasActiveHold}
        />
      ) : null}
    </section>
  );
}

function ReservationStageLoading({
  stage,
}: {
  stage: "send" | "followup";
}) {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="section-band p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="h-6 w-32 rounded-pill bg-surface-elevated/80" />
            <div className="space-y-2">
              <div className="h-10 w-full max-w-xl rounded-2xl bg-surface-elevated/80" />
              <div className="h-5 w-3/4 rounded-2xl bg-surface-elevated/70" />
            </div>
          </div>

          <div className="w-full max-w-sm rounded-card border border-border/60 bg-surface/72 p-4">
            <div className="h-4 w-24 rounded bg-surface-elevated/80" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-card border border-border/60 bg-surface-elevated/60 p-3"
                >
                  <div className="h-3 w-20 rounded bg-background/40" />
                  <div className="mt-3 h-4 w-full rounded bg-background/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-5 min-h-[16rem] rounded-card border border-border/60 bg-surface-elevated/70 p-4 sm:p-6">
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-background/40" />
                <div className="h-7 w-52 rounded bg-background/40" />
                <div className="h-4 w-64 rounded bg-background/40" />
              </div>
              <div className="h-16 w-16 rounded-full bg-background/20" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-card border border-border/60 bg-background/18 p-3"
                >
                  <div className="h-3 w-20 rounded bg-background/40" />
                  <div className="mt-3 h-4 w-full rounded bg-background/40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="section-band panel-space">
          <div className="space-y-3">
            <div className="h-4 w-28 rounded bg-surface-elevated/80" />
            <div className="h-6 w-64 rounded bg-surface-elevated/80" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: stage === "followup" ? 6 : 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="rounded-card border border-border/60 bg-surface-elevated/60 p-4"
                  >
                    <div className="h-3 w-24 rounded bg-background/40" />
                    <div className="mt-3 h-4 w-full rounded bg-background/40" />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="section-band panel-space">
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-surface-elevated/80" />
            <div className="h-6 w-72 rounded bg-surface-elevated/80" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-card border border-border/60 bg-surface-elevated/60 p-4"
                >
                  <div className="h-3 w-20 rounded bg-background/40" />
                  <div className="mt-3 h-4 w-full rounded bg-background/40" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="h-12 w-full rounded-pill bg-surface-elevated/80 sm:max-w-[14rem]" />
              <div className="h-12 w-full rounded-pill bg-surface-elevated/70 sm:max-w-[11rem]" />
              <div className="h-12 w-full rounded-pill bg-surface-elevated/70 sm:max-w-[11rem]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationKeyFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="meta-label">{label}</p>
      <p className="text-[0.95rem] font-semibold leading-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function ReservationScheduleStrip({
  motorcycle,
  pickupDate,
  returnDate,
  pickupMode,
  hasActiveHold,
  onEdit,
}: {
  motorcycle: CatalogMotorcycle | null;
  pickupDate: string;
  returnDate: string;
  pickupMode: ReservationPickupMode;
  hasActiveHold: boolean;
  onEdit: () => void;
}) {
  const pickupModeLabel =
    pickupMode === "motorcycle-location"
      ? motorcycle?.locationLabel ?? "Retrait sur place"
      : (PICKUP_MODE_OPTIONS.find((option) => option.value === pickupMode)
          ?.label ?? "Livraison");
  return (
    <div className="flex flex-col gap-3 border-y border-border/60 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="meta-label">Créneau</p>
          {hasActiveHold ? (
            <Badge variant="warning" size="sm">
              Demande en cours
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-sm font-semibold text-foreground">
          {formatDateRange(pickupDate, returnDate)} • {pickupModeLabel}
        </p>
        {hasActiveHold ? (
          <p className="text-xs text-muted-foreground">
            Modifier le créneau relancera la vérification en cours.
          </p>
        ) : null}
      </div>

      <Button
        as="button"
        type="button"
        ariaLabel="Modifier le créneau de réservation"
        variant="outline"
        size="md"
        className="min-h-11"
        onClick={onEdit}
      >
        Modifier
      </Button>
    </div>
  );
}

function ReservationPlanningModal({
  draft,
  onDraftChange,
  onClose,
  onApply,
  hasActiveHold,
}: {
  draft: {
    pickupDate: string;
    returnDate: string;
    pickupMode: ReservationPickupMode;
  };
  onDraftChange: (draft: {
    pickupDate: string;
    returnDate: string;
    pickupMode: ReservationPickupMode;
  }) => void;
  onClose: () => void;
  onApply: () => void;
  hasActiveHold: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionIds = hasActiveHold
    ? "planning-modal-description planning-modal-note"
    : "planning-modal-description";

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      titleRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (
          activeElement === firstFocusable ||
          activeElement === titleRef.current
        ) {
          event.preventDefault();
          lastFocusable.focus();
        }
        return;
      }

      if (activeElement === titleRef.current) {
        event.preventDefault();
        firstFocusable.focus();
        return;
      }

      if (activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/58 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="planning-modal-title"
        aria-describedby={descriptionIds}
        className="section-band flex max-h-[min(86svh,42rem)] w-full max-w-xl flex-col overflow-hidden p-4 sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-2">
            <p className="label">Planning</p>
            <h2
              id="planning-modal-title"
              ref={titleRef}
              tabIndex={-1}
              className="heading-3 text-foreground focus:outline-none"
            >
              Ajustez votre créneau
            </h2>
            <p
              id="planning-modal-description"
              className="text-sm text-muted-foreground"
            >
              Dates et retrait recalculent la disponibilité.
            </p>
          </div>
          <Button
            as="button"
            type="button"
            ariaLabel="Fermer la modale de planning"
            variant="outline"
            size="md"
            className="min-h-11 shrink-0"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Départ" htmlFor="planning-modal-pickup-date">
              <Input
                id="planning-modal-pickup-date"
                type="date"
                value={draft.pickupDate}
                min={formatDateInputValue(new Date())}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    pickupDate: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Retour" htmlFor="planning-modal-return-date">
              <Input
                id="planning-modal-return-date"
                type="date"
                value={draft.returnDate}
                min={draft.pickupDate || formatDateInputValue(new Date())}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    returnDate: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Retrait" htmlFor="planning-modal-pickup-mode">
              <select
                id="planning-modal-pickup-mode"
                value={draft.pickupMode}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    pickupMode: parseReservationPickupMode(event.target.value),
                  })
                }
                className="input-shell appearance-none pr-10"
              >
                {PICKUP_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {hasActiveHold
              ? "Appliquer ces changements rouvrira la vérification en cours."
              : "Appliquer ces changements relancera la vérification du créneau."}
          </p>
          {hasActiveHold ? (
            <p id="planning-modal-note" className="sr-only">
              Appliquer ces changements rouvrira la vérification en cours.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              as="button"
              type="button"
              ariaLabel="Annuler les modifications du planning"
              variant="outline"
              size="md"
              className="min-h-11 w-full sm:w-auto"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              as="button"
              type="button"
              ariaLabel="Appliquer les modifications du planning"
              variant="accent"
              size="md"
              className="min-h-11 w-full sm:w-auto"
              onClick={onApply}
            >
              Appliquer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationStepper({
  viewStage,
  hasChecked,
  isReady,
}: {
  viewStage: ReservationStage;
  hasChecked: boolean;
  isReady: boolean;
}) {
  const activeIndex =
    viewStage === "confirmed"
      ? 3
      : viewStage === "payment"
        ? 2
        : viewStage === "client"
          ? 1
          : 0;

  const steps = [
    { title: "Vérification", compactTitle: "Choix" },
    { title: "Dossier", compactTitle: "Dossier" },
    { title: "Envoi", compactTitle: "Envoi" },
    { title: "Suivi", compactTitle: "Suivi" },
  ];

  return (
    <>
      <div className="space-y-3 border-t border-border/60 pt-4 md:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground/68">
          Étape {activeIndex + 1} sur 4
        </p>

        <ol
          className="grid grid-cols-4 gap-2"
          aria-label="Progression de la réservation"
        >
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const isDone =
              index < activeIndex || (index === 0 && hasChecked && isReady);

            return (
              <li key={step.title} className="min-w-0">
                <div
                  className={cn(
                    "flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-card border px-2 py-2 text-center",
                    isDone
                      ? "border-success/20 bg-success/10"
                      : isActive
                        ? "border-brand/20 bg-brand-soft"
                        : "border-border/70 bg-surface/80",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full border text-[0.68rem] font-semibold",
                      isDone
                        ? "border-success/20 bg-success/12 text-success"
                        : isActive
                          ? "border-brand/20 bg-background text-brand-strong"
                          : "border-border/70 bg-surface text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[0.7rem] font-semibold leading-tight",
                      isActive || isDone
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.compactTitle}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="hidden space-y-4 border-t border-border/60 pt-4 md:block">
        <p className="text-sm font-medium text-muted-foreground">
          Étape {activeIndex + 1} sur 4
        </p>

        <ol
          className="grid gap-3 sm:grid-cols-4"
          aria-label="Progression de la réservation"
        >
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const isDone =
              index < activeIndex || (index === 0 && hasChecked && isReady);

            return (
              <li key={step.title} className="min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                      isDone
                        ? "border-success/20 bg-success/12 text-success"
                        : isActive
                          ? "border-brand/20 bg-brand-soft text-brand-strong"
                          : "border-border/70 bg-surface text-muted-foreground",
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {index < steps.length - 1 ? (
                    <span
                      className={cn(
                        "h-px flex-1",
                        isDone
                          ? "bg-success/35"
                          : isActive
                            ? "bg-brand/35"
                            : "bg-border/80",
                      )}
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isActive || isDone
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}

function ReservationResultCard({
  hasChecked,
  isReady,
  evaluation,
}: {
  hasChecked: boolean;
  isReady: boolean;
  evaluation: ReturnType<typeof evaluateReservation>;
}) {
  if (!hasChecked || isReady) {
    return null;
  }

  return (
    <section id="confirmation-preview" aria-live="polite">
      <div className={cn("space-y-4 border-b border-warning/20 pb-8")}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">À corriger</Badge>
            <Badge variant="outline">
              {evaluation.durationDays > 0
                ? `${evaluation.durationDays} jour(s)`
                : "Durée non valide"}
            </Badge>
          </div>

          <div className="space-y-4">
            <h2 className="heading-3 text-foreground">
              Ce créneau ne fonctionne pas encore.
            </h2>
            <p className="body-copy text-muted-foreground">
              Ajustez les dates, le retrait ou choisissez une autre moto.
            </p>
            {!isReady && evaluation.nextAvailableLabel ? (
              <p className="text-sm text-muted-foreground">
                {evaluation.nextAvailableLabel}
              </p>
            ) : null}
          </div>

          <div className="list-rail">
            {evaluation.summaryPoints.map((point) => (
              <div key={point} className="px-4 py-4">
                <p className="body-copy text-foreground/78">{point}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              as="link"
              href="#reservation-form"
              ariaLabel="Modifier la réservation"
              variant="accent"
              size="md"
            >
              Modifier la sélection
            </Button>
            <Button
              as="link"
              href="/motos"
              ariaLabel="Revenir au catalogue"
              variant="outline"
              size="md"
            >
              Revenir au catalogue
            </Button>
          </div>

          <ul className="space-y-2 rounded-card border border-warning/20 bg-warning/8 p-4 body-copy text-foreground/80">
            {evaluation.blockers.map((blocker) => (
              <li key={blocker} className="flex gap-2">
                <span className="mt-[0.45rem] h-1.5 w-1.5 flex-none rounded-full bg-warning" />
                <span>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

type ReservationSurfaceContext = {
  currentStageLabel: string;
  eyebrow: string;
  statusLabel: string;
  statusTone:
    | "neutral"
    | "accent"
    | "outline"
    | "success"
    | "warning"
    | "danger";
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionType: "button" | "link";
  primaryActionHref: string | null;
  primaryActionVariant: "accent" | "outline";
  secondaryActionLabel: string;
  secondaryActionHref: string;
  tertiaryActionLabel: string | null;
  tertiaryActionHref: string | null;
};

function getReservationSurfaceContext({
  viewStage,
  hasChecked,
  isReady,
  readyForPreparation,
  hasSelectedMotorcycle,
  paymentReady,
  confirmationReady,
  selectionHref,
  catalogHref,
}: {
  viewStage: ReservationStage;
  hasChecked: boolean;
  isReady: boolean;
  readyForPreparation: boolean;
  hasSelectedMotorcycle: boolean;
  paymentReady: boolean;
  confirmationReady: boolean;
  selectionHref: string;
  catalogHref: string;
}): ReservationSurfaceContext {
  const currentStageLabel =
    viewStage === "confirmed"
      ? "Suivi"
      : viewStage === "payment"
      ? "Envoi"
      : viewStage === "client"
        ? "Dossier"
          : "Vérification";

  const eyebrow =
    viewStage === "confirmed"
      ? "Suivi"
      : viewStage === "payment"
      ? "Envoi"
      : viewStage === "client"
        ? "Dossier"
          : "Vérification";

  const title =
    viewStage === "confirmed"
      ? confirmationReady
        ? "Votre réservation est confirmée."
        : "Votre demande a bien été envoyée."
      : viewStage === "payment"
        ? "Vérifiez avant l'envoi."
      : viewStage === "client"
          ? "Renseignez votre dossier."
          : "Vérifiez votre créneau.";

  const description =
    viewStage === "confirmed"
      ? confirmationReady
        ? "Conservez la référence. Le paiement se fera au retrait."
        : "Nous reviendrons vers vous pour confirmer la réservation et le retrait."
      : viewStage === "payment"
        ? "Relisez l'essentiel avant validation. Le paiement se fera au retrait."
      : viewStage === "client"
        ? "Coordonnées et permis suffisent pour continuer."
        : "Choisissez la moto et le créneau.";

  const statusTone =
    viewStage === "confirmed"
      ? confirmationReady
        ? "success"
        : "warning"
      : viewStage === "payment"
        ? paymentReady
          ? "success"
          : "warning"
        : viewStage === "client"
          ? readyForPreparation
            ? "success"
            : "warning"
          : hasChecked
            ? isReady
              ? "success"
              : "warning"
            : "neutral";

  const statusLabel =
    viewStage === "confirmed"
      ? confirmationReady
        ? "Confirmée"
        : "En attente"
      : viewStage === "payment"
        ? paymentReady
          ? "Envoyée"
          : "Prête à envoyer"
        : viewStage === "client"
          ? readyForPreparation
            ? "Prête à envoyer"
            : "À compléter"
          : hasChecked
            ? isReady
              ? "Compatible"
              : "À corriger"
            : "À vérifier";

  const primaryActionLabel =
    viewStage === "confirmed"
      ? confirmationReady
        ? "Retour au catalogue"
        : "Retour aux motos"
      : viewStage === "payment"
        ? "Envoyer la demande"
      : viewStage === "client"
        ? "Continuer"
      : hasSelectedMotorcycle
        ? hasChecked && isReady
          ? "Continuer"
          : "Vérifier la disponibilité"
        : "Ouvrir le catalogue";

  const primaryActionType =
    viewStage === "confirmed"
      ? "link"
      : hasSelectedMotorcycle
        ? "button"
        : "link";
  const primaryActionHref =
    viewStage === "confirmed"
      ? catalogHref
      : hasSelectedMotorcycle
        ? null
        : catalogHref;
  const primaryActionVariant =
    viewStage === "confirmed"
      ? confirmationReady
        ? "accent"
        : "outline"
      : viewStage === "payment"
        ? "accent"
        : hasSelectedMotorcycle
          ? "accent"
          : "accent";

  const secondaryActionLabel =
    viewStage === "confirmed"
      ? "Modifier mes dates"
      : viewStage === "payment"
        ? "Modifier mes dates"
        : viewStage === "client"
          ? "Modifier la réservation"
          : hasSelectedMotorcycle
            ? "Voir les conditions"
            : "Voir les conditions";
  const secondaryActionHref =
    viewStage === "confirmed"
      ? selectionHref
      : viewStage === "payment"
        ? selectionHref
        : viewStage === "client"
          ? selectionHref
          : hasSelectedMotorcycle
            ? "/conditions"
            : "/conditions";
  const tertiaryActionLabel =
    viewStage === "confirmed" || viewStage === "payment"
      ? "Voir les conditions"
      : null;
  const tertiaryActionHref = tertiaryActionLabel ? "/conditions" : null;

  return {
    currentStageLabel,
    eyebrow,
    statusLabel,
    statusTone,
    title,
    description,
    primaryActionLabel,
    primaryActionType,
    primaryActionHref,
    primaryActionVariant,
    secondaryActionLabel,
    secondaryActionHref,
    tertiaryActionLabel,
    tertiaryActionHref,
  };
}

function getReservationSidebarAction({
  viewStage,
  hasChecked,
  isReady,
  readyForPreparation,
  paymentReady,
  confirmationReady,
  selectionHref,
  clientHref,
  paymentHref,
  confirmationHref,
  catalogHref,
}: {
  viewStage: ReservationStage;
  hasChecked: boolean;
  isReady: boolean;
  readyForPreparation: boolean;
  paymentReady: boolean;
  confirmationReady: boolean;
  selectionHref: string;
  clientHref: string;
  paymentHref: string;
  confirmationHref: string;
  catalogHref: string;
}) {
  if (viewStage === "confirmed") {
    return confirmationReady
      ? {
          label: "Retour au catalogue",
          href: catalogHref,
          ariaLabel: "Retourner au catalogue de motos",
        }
      : {
          label: "Voir les motos",
          href: catalogHref,
          ariaLabel: "Retourner à la page motos",
        };
  }

  if (viewStage === "payment") {
    return paymentReady
      ? {
          label: "Voir le suivi",
          href: confirmationHref,
          ariaLabel: "Voir le suivi de réservation",
        }
      : {
          label: "Envoyer la demande",
          href: paymentHref,
          ariaLabel: "Envoyer la demande de réservation",
        };
  }

  if (viewStage === "client") {
    return {
      label: "Continuer",
      href: readyForPreparation ? paymentHref : clientHref,
      ariaLabel: "Continuer dans le tunnel de réservation",
    };
  }

  return hasChecked && isReady
    ? {
        label: "Continuer",
        href: clientHref,
        ariaLabel: "Continuer vers le dossier client",
      }
    : {
        label: "Vérifier la disponibilité",
        href: selectionHref,
        ariaLabel: "Vérifier la disponibilité du créneau",
      };
}

function ReservationMobileSummary({
  motorcycle,
  pickupDate,
  returnDate,
  pickupMode,
  hasActiveHold,
  actions,
  onEdit,
}: {
  motorcycle: CatalogMotorcycle | null;
  pickupDate: string;
  returnDate: string;
  pickupMode: ReservationPickupMode;
  hasActiveHold: boolean;
  actions: ReservationSurfaceContext;
  onEdit: () => void;
}) {
  const pickupLabel =
    pickupMode === "motorcycle-location"
      ? motorcycle?.locationLabel ?? "Retrait sur place"
      : (PICKUP_MODE_OPTIONS.find((option) => option.value === pickupMode)
          ?.label ?? "À définir");

  return (
    <div className="section-band p-4 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Badge variant={actions.statusTone} size="sm">
            {actions.statusLabel}
          </Badge>
          <h2 className="text-base font-semibold leading-tight text-foreground">
            {motorcycle
              ? `${motorcycle.brand} ${motorcycle.name}`
              : "Moto à choisir"}
          </h2>
          {!motorcycle ? (
            <p className="text-sm text-muted-foreground">
              Choisissez un modèle puis vérifiez le créneau.
            </p>
          ) : null}
        </div>

        <Button
          as="button"
          type="button"
          ariaLabel="Modifier le créneau de réservation"
          variant="outline"
          size="md"
          className="min-h-11 shrink-0 px-4"
          onClick={onEdit}
        >
          Modifier
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ReservationCompactFact
          label="Créneau"
          value={formatDateRange(pickupDate, returnDate)}
        />
        <ReservationCompactFact label="Retrait" value={pickupLabel} />
        <ReservationCompactFact
          label="Permis"
          value={motorcycle?.licenseCategory ?? "À vérifier"}
        />
      </div>

      {hasActiveHold ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Modifier ce créneau relancera la vérification en cours.
        </p>
      ) : null}
    </div>
  );
}

function ReservationMobileDock({
  motorcycle,
  actions,
  pickupDate,
  returnDate,
  pickupMode,
  clientValidation,
  clientDraftStatusLabel,
  onPrimaryAction,
}: {
  motorcycle: CatalogMotorcycle | null;
  actions: ReservationSurfaceContext;
  pickupDate: string;
  returnDate: string;
  pickupMode: ReservationPickupMode;
  clientValidation: ReservationClientValidation;
  clientDraftStatusLabel: string;
  onPrimaryAction: () => void;
}) {
  const primaryButton = actions.primaryActionType === "button";
  const pickupLabel =
    pickupMode === "motorcycle-location"
      ? (motorcycle?.locationLabel ?? "À définir")
      : (PICKUP_MODE_OPTIONS.find((option) => option.value === pickupMode)
          ?.label ?? "À définir");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="overlay-sheet mx-auto max-w-md p-3 shadow-[var(--shadow-elevated)]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="meta-label">Action</p>
              <Badge variant={actions.statusTone} size="sm">
                {actions.statusLabel}
              </Badge>
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {motorcycle
                ? `${motorcycle.brand} ${motorcycle.name}`
                : "Moto à choisir"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateRange(pickupDate, returnDate)} • {pickupLabel}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {primaryButton ? (
            <Button
              as="button"
              type="button"
              ariaLabel={actions.primaryActionLabel}
              variant={actions.primaryActionVariant}
              size="md"
              className="min-h-11 w-full"
              onClick={onPrimaryAction}
            >
              {actions.primaryActionLabel}
            </Button>
          ) : (
            <Button
              as="link"
              href={actions.primaryActionHref ?? "/motos"}
              ariaLabel={actions.primaryActionLabel}
              variant={actions.primaryActionVariant}
              size="md"
              className="min-h-11 w-full"
            >
              {actions.primaryActionLabel}
            </Button>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.72rem] text-muted-foreground">
              {clientValidation.readyForReview
                ? "Prêt pour l'étape suivante"
                : clientDraftStatusLabel}
            </span>
            <Link
              href={actions.secondaryActionHref}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              {actions.secondaryActionLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationCompactFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-border/60 bg-surface/72 px-3 py-3">
      <p className="meta-label">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  help,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {help ? <p className="field-help">{help}</p> : null}
    </div>
  );
}

function getMobileReservationHeaderCopy({
  viewStage,
  confirmationReady,
}: {
  viewStage: ReservationStage;
  confirmationReady: boolean;
}) {
  if (viewStage === "confirmed") {
    return confirmationReady
      ? {
          title: "Votre réservation est confirmée.",
          description: "Conservez la référence et préparez le retrait.",
        }
      : {
          title: "Demande envoyée.",
          description: "Nous revenons vers vous pour confirmer le retrait.",
        };
  }

  if (viewStage === "payment") {
    return {
      title: "Vérifiez avant l'envoi.",
      description: "Relisez l'essentiel avant validation.",
    };
  }

  if (viewStage === "client") {
    return {
      title: "Finalisez votre réservation.",
      description: "Complétez le dossier, puis continuez.",
    };
  }

  return {
    title: "Finalisez votre réservation.",
    description: "Choisissez la moto et le créneau, puis continuez.",
  };
}

function getReservationStageAnnouncement({
  viewStage,
  confirmationReady,
}: {
  viewStage: ReservationStage;
  confirmationReady: boolean;
}) {
  if (viewStage === "confirmed") {
    return confirmationReady
      ? "Étape suivi. Votre réservation est confirmée."
      : "Étape suivi. Votre demande a bien été envoyée.";
  }

  if (viewStage === "payment") {
    return "Étape envoi. Vérifiez les informations avant d'envoyer votre demande.";
  }

  if (viewStage === "client") {
    return "Étape dossier. Complétez les informations nécessaires pour poursuivre.";
  }

  return "Étape vérification. Choisissez le créneau et vérifiez la disponibilité.";
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.getClientRects().length > 0,
  );
}
