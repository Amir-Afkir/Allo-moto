"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PlanningAvailabilityBlock,
  PlanningReservationRecord,
} from "@/app/_features/reservation/data/reservation-planning";

import {
  hydratePublicBlock, hydratePublicReservation,
  type PublicPlanningBlock, type PublicPlanningReservation,
} from "@/app/_features/reservation/data/public-planning";

export function usePlanningLedger(initial?: {
  reservations?: ReadonlyArray<PublicPlanningReservation>;
  blocks?: ReadonlyArray<PublicPlanningBlock>;
}) {
  const [reservations, setReservations] = useState<PlanningReservationRecord[]>(
    () => (initial?.reservations ?? []).map(hydratePublicReservation),
  );
  const [blocks, setBlocks] = useState<PlanningAvailabilityBlock[]>(
    () => (initial?.blocks ?? []).map(hydratePublicBlock),
  );

  const initialReservations = initial?.reservations;
  const initialBlocks = initial?.blocks;
  useEffect(() => {
    setReservations((current) => {
      const publicRecords = (initialReservations ?? []).map(hydratePublicReservation);
      // Preserve the private receipt loaded by its owner, never expose it to other clients.
      const privateReceipts = current.filter((record) => Boolean(record.reference));
      const privateIds = new Set(privateReceipts.map((record) => record.id));
      return [...publicRecords.filter((record) => !privateIds.has(record.id)), ...privateReceipts];
    });
    setBlocks((initialBlocks ?? []).map(hydratePublicBlock));
  }, [initialReservations, initialBlocks]);

  return useMemo(
    () => ({
      reservations,
      blocks,
      loaded: true,
      setReservations,
      setBlocks,
    }),
    [blocks, reservations],
  );
}
