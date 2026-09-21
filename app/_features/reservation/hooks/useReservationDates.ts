"use client";
import { useEffect, useRef, useState } from "react";
import { createDefaultReservationWindow } from "../data/reservation";

/** Empty deterministic SSR state; current Paris dates after hydration.
 * Refresh automatic dates on focus/day rollover without replacing user choices. */
export function useReservationDates() {
  const [dates, setDates] = useState({ pickupDate: "", returnDate: "" });
  const touched = useRef(false);
  useEffect(() => {
    const refresh = () => {
      if (touched.current) return;
      const next = createDefaultReservationWindow();
      setDates((current) => current.pickupDate === next.pickupDate && current.returnDate === next.returnDate ? current : next);
    };
    refresh();
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, []);
  return {
    ...dates,
    setPickupDate(value: string) { touched.current = true; setDates((current) => ({ ...current, pickupDate: value })); },
    setReturnDate(value: string) { touched.current = true; setDates((current) => ({ ...current, returnDate: value })); },
    resetDates() { touched.current = false; setDates(createDefaultReservationWindow()); },
  };
}
