import { NextRequest, NextResponse } from "next/server";
import { createReservationRequest } from "@/app/_features/ops/data/ops-store";
import { getPrivateReservationReceipt, RECEIPT_COOKIE, toPrivateReservationReceipt } from "@/app/_features/ops/data/reservation-receipt";
import { createAccessToken, getSessionSecret, SESSION_MAX_AGE_SECONDS } from "@/app/_features/ops/lib/session-security";
import { parseReservationRequest, readReservationRequest, RequestBodyError, ReservationInputError } from "@/app/_features/reservation/data/reservation-request";

export const dynamic = "force-dynamic";
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };

export async function GET(request: NextRequest) {
  try {
    const reservation = await getPrivateReservationReceipt(request.cookies.get(RECEIPT_COOKIE)?.value);
    return NextResponse.json(
      reservation ? { ok: true, reservation } : { ok: false, message: "Suivi non accessible dans ce navigateur." },
      { status: reservation ? 200 : 404, headers: PRIVATE_HEADERS },
    );
  } catch {
    return NextResponse.json({ ok: false, message: "Suivi temporairement indisponible." }, { status: 503, headers: PRIVATE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ ok: false, message: "Origine non autorisée." }, { status: 403, headers: PRIVATE_HEADERS });
  }
  try {
    const input = parseReservationRequest(await readReservationRequest(request));
    // Check BEFORE persisting: a successful request must always get its private receipt.
    const secret = getSessionSecret();
    if (!secret) {
      return NextResponse.json({ ok: false, message: "Les demandes sont temporairement indisponibles." }, { status: 503, headers: PRIVATE_HEADERS });
    }
    const result = await createReservationRequest(input);
    const response = NextResponse.json({
      ok: true,
      reservation: toPrivateReservationReceipt(result.reservation),
      message: "Demande enregistrée.",
    }, { headers: PRIVATE_HEADERS });
    response.cookies.set(RECEIPT_COOKIE, createAccessToken(result.reservation.id, "reservation", secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/reservations",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof RequestBodyError || error instanceof ReservationInputError) {
      return NextResponse.json({ ok: false, message: error.message }, {
        status: error instanceof RequestBodyError ? error.status : 422,
        headers: PRIVATE_HEADERS,
      });
    }
    // Never send database errors, schema names, paths or customer data to the browser.
    console.error("Reservation creation failed.");
    return NextResponse.json({ ok: false, message: "La demande n'a pas pu être enregistrée." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
