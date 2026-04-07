const DEFAULT_WHATSAPP_MESSAGE = "Bonjour, j’ai une question avant de reserver une moto.";
const DEFAULT_MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
const DEFAULT_COUNTRY = "France";

let supportConfigPromise: Promise<SupportConfig> | null = null;

export type SupportMapConfig = {
  latitude: number;
  longitude: number;
  accessToken: string;
  styleUrl: string;
  zoom: number;
  pitch: number;
  bearing: number;
};

export type SupportConfig = {
  placeName: string | null;
  phoneDisplay: string | null;
  phoneHref: string | null;
  whatsappPhoneDigits: string | null;
  whatsappHref: string | null;
  whatsappMessage: string;
  addressLines: string[];
  addressSummary: string | null;
  mapsHref: string | null;
  map: SupportMapConfig | null;
};

type MapboxGeocodingFeature = {
  center?: [number, number];
  place_name?: string;
};

type MapboxGeocodingResponse = {
  features?: MapboxGeocodingFeature[];
};

function normalizePhone(value: string | undefined) {
  if (!value) return "";
  return value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

function phoneDigits(value: string | undefined) {
  return normalizePhone(value).replace(/\D/g, "");
}

function formatPhoneDisplay(value: string | undefined) {
  const normalized = normalizePhone(value);
  if (!normalized) return null;

  const digits = phoneDigits(value);
  if (!digits) return null;

  if (digits.startsWith("33") && digits.length === 11) {
    const local = digits.slice(2).match(/.{1,2}/g)?.join(" ") ?? digits.slice(2);
    return `+33 ${local}`;
  }

  if (digits.length === 10) {
    return digits.match(/.{1,2}/g)?.join(" ") ?? digits;
  }

  return normalized.startsWith("+") ? normalized : `+${digits}`;
}

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCoordinate(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildAddressQuery(addressLines: string[]) {
  const pieces = [...addressLines, DEFAULT_COUNTRY].filter(Boolean);
  return pieces.join(", ");
}

async function geocodeSupportAddress(query: string, accessToken: string) {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("autocomplete", "false");
  url.searchParams.set("limit", "1");
  url.searchParams.set("language", "fr");
  url.searchParams.set("country", "fr");
  url.searchParams.set("types", "address,place,locality,postcode");

  const response = await fetch(url.toString(), {
    cache: "force-cache",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as MapboxGeocodingResponse;
  const center = payload.features?.[0]?.center;

  if (!center || center.length < 2) {
    return null;
  }

  const [longitude, latitude] = center;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return { longitude, latitude };
}

async function buildSupportConfig(): Promise<SupportConfig> {
  const phoneRaw = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  const whatsappRaw = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE?.trim() || phoneRaw;
  const whatsappPhoneDigits = phoneDigits(whatsappRaw) || null;
  const phoneDisplay = process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY?.trim() || formatPhoneDisplay(phoneRaw);
  const whatsappMessage = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_MESSAGE?.trim() || DEFAULT_WHATSAPP_MESSAGE;
  const placeName = process.env.NEXT_PUBLIC_SUPPORT_PLACE_NAME?.trim() || null;
  const addressLine1 = process.env.NEXT_PUBLIC_SUPPORT_ADDRESS_LINE_1?.trim() || "";
  const postalCode = process.env.NEXT_PUBLIC_SUPPORT_POSTAL_CODE?.trim() || "";
  const city = process.env.NEXT_PUBLIC_SUPPORT_CITY?.trim() || "";
  const localityLine = [postalCode, city].filter(Boolean).join(" ");
  const addressLines = [addressLine1, localityLine].filter(Boolean);
  const addressSummary = [placeName, ...addressLines].filter(Boolean).join(" • ") || null;
  const phoneHref = phoneDigits(phoneRaw) ? `tel:+${phoneDigits(phoneRaw)}` : null;
  const whatsappHref = buildSupportWhatsAppHref(whatsappPhoneDigits, whatsappMessage);

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "";
  const styleUrl = process.env.NEXT_PUBLIC_SUPPORT_MAPBOX_STYLE?.trim() || DEFAULT_MAPBOX_STYLE;
  const addressQuery = process.env.NEXT_PUBLIC_SUPPORT_ADDRESS_QUERY?.trim() || buildAddressQuery(addressLines);
  const explicitLatitude = parseCoordinate(process.env.NEXT_PUBLIC_SUPPORT_LATITUDE);
  const explicitLongitude = parseCoordinate(process.env.NEXT_PUBLIC_SUPPORT_LONGITUDE);

  let resolvedLocation: { latitude: number; longitude: number } | null = null;
  if (explicitLatitude !== null && explicitLongitude !== null) {
    resolvedLocation = { latitude: explicitLatitude, longitude: explicitLongitude };
  } else if (addressQuery && accessToken) {
    resolvedLocation = await geocodeSupportAddress(addressQuery, accessToken);
  }

  const map =
    resolvedLocation && accessToken
      ? {
          latitude: resolvedLocation.latitude,
          longitude: resolvedLocation.longitude,
          accessToken,
          styleUrl,
          zoom: parseNumber(process.env.NEXT_PUBLIC_SUPPORT_MAPBOX_ZOOM, 14),
          pitch: parseNumber(process.env.NEXT_PUBLIC_SUPPORT_MAPBOX_PITCH, 20),
          bearing: parseNumber(process.env.NEXT_PUBLIC_SUPPORT_MAPBOX_BEARING, -18),
        }
      : null;

  const mapsQuery = addressQuery || (map ? `${map.latitude},${map.longitude}` : "");
  const mapsHref = mapsQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
    : null;

  return {
    placeName,
    phoneDisplay,
    phoneHref,
    whatsappPhoneDigits,
    whatsappHref,
    whatsappMessage,
    addressLines,
    addressSummary,
    mapsHref,
    map,
  };
}

export function buildSupportWhatsAppHref(phone: string | null, message: string) {
  if (!phone) {
    return null;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function getSupportConfig(): Promise<SupportConfig> {
  if (!supportConfigPromise) {
    supportConfigPromise = buildSupportConfig();
  }

  return supportConfigPromise;
}
