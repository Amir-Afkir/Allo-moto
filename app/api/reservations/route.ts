import { NextRequest, NextResponse } from "next/server";
import { createReservationRequest } from "@/app/_features/ops/data/ops-store";
import {
  parsePermitSelection,
  parseReservationPickupMode,
  type ReservationDraft,
} from "@/app/_features/reservation/data/reservation";
import type { ReservationClientDraft } from "@/app/_features/reservation/data/reservation-intake";

export const dynamic = "force-dynamic";

type ReservationRequestBody = {
  draft?: {
    motorcycleSlug?: string;
    pickupDate?: string;
    returnDate?: string;
    pickupMode?: string;
    permit?: string;
  };
  clientDraft?: ReservationClientDraft;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | ReservationRequestBody
    | null;

  if (!body?.draft || !body.clientDraft) {
    return NextResponse.json(
      { ok: false, message: "Corps de requete incomplet." },
      { status: 400 },
    );
  }

  const draft: ReservationDraft = {
    motorcycleSlug: body.draft.motorcycleSlug ?? "",
    pickupDate: body.draft.pickupDate ?? "",
    returnDate: body.draft.returnDate ?? "",
    pickupMode: parseReservationPickupMode(body.draft.pickupMode),
    permit: parsePermitSelection(body.draft.permit),
  };

  try {
    const result = await createReservationRequest({
      draft,
      clientDraft: body.clientDraft,
    });

    return NextResponse.json({
      ok: true,
      reservation: result.planningReservation,
      message: "Demande enregistree.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "La demande n'a pas pu etre enregistree.",
      },
      { status: 422 },
    );
  }
}
