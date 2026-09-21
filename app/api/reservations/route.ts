import { ReservationPriceChangedError } from "@/app/_features/reservation/data/reservation-pricing";
import { NextRequest, NextResponse } from "next/server";
import { createReservationRequest } from "@/app/_features/ops/data/ops-store";
import { getBrowserReservationReceipts, receiptCapabilities, receiptCookieName, MAX_BROWSER_RECEIPTS, toPrivateReservationReceipt } from "@/app/_features/ops/data/reservation-receipt";
import { createAccessToken, getSessionSecret, SESSION_MAX_AGE_SECONDS } from "@/app/_features/ops/lib/session-security";
import { parseIdempotencyKey, parseReservationRequest, readReservationRequest, RequestBodyError, ReservationInputError } from "@/app/_features/reservation/data/reservation-request";

export const dynamic = "force-dynamic";
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };

export async function GET(request: NextRequest) {
  try {
    const requestedId = new URL(request.url).searchParams.get("id");
    const reservations = await getBrowserReservationReceipts(request.cookies.getAll(), requestedId);
    const reservation = reservations[0] ?? null;
    return NextResponse.json(
      reservation ? { ok: true, reservation, reservations } : { ok: false, message: "Suivi non accessible dans ce navigateur." },
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
    const idempotencyKey = parseIdempotencyKey(request.headers.get("idempotency-key"));
    const result = await createReservationRequest({ ...input, idempotencyKey });
    const response = NextResponse.json({
      ok: true,
      reservation: toPrivateReservationReceipt(result.reservation),
      message: "Demande enregistrée.",
    }, { headers: PRIVATE_HEADERS });
    response.cookies.set(receiptCookieName(result.reservation.id), createAccessToken(result.reservation.id, "reservation", secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/reservations",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    // Keep a bounded set of receipts; old tabs retain their own capability until
    // expiry/eviction. Never merge all IDs into one cookie (racy concurrent POSTs).
    const old = receiptCapabilities(request.cookies?.getAll() ?? []).filter(({ id }) => id !== result.reservation.id);
    for (const { name } of old.slice(MAX_BROWSER_RECEIPTS - 1)) {
      response.cookies.set(name, "", { path: "/api/reservations", maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
    }
    return response;
  } catch (error) {
    if (error instanceof ReservationPriceChangedError) {
      return NextResponse.json({ ok: false, code: "PRICE_CHANGED", message: error.message,
        currentPricing: error.currentPricing }, { status: 409, headers: PRIVATE_HEADERS });
    }
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
