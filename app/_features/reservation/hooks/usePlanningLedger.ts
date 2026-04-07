"use client";

import { useMemo, useState } from "react";
import type {
  PlanningAvailabilityBlock,
  PlanningReservationRecord,
} from "@/app/_features/reservation/data/reservation-planning";

export function usePlanningLedger(initial?: {
  reservations?: ReadonlyArray<PlanningReservationRecord>;
  blocks?: ReadonlyArray<PlanningAvailabilityBlock>;
}) {
  const [reservations, setReservations] = useState<PlanningReservationRecord[]>(
    () => [...(initial?.reservations ?? [])],
  );
  const [blocks, setBlocks] = useState<PlanningAvailabilityBlock[]>(
    () => [...(initial?.blocks ?? [])],
  );

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
