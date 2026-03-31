import type {
  SetuConsentResponse,
  SetuDataSessionResponse,
} from "./types";

const SETU_BASE_URL =
  process.env.SETU_BASE_URL || "https://fiu-sandbox.setu.co";
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID || "";
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET || "";
const SETU_PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID || "";
const SETU_REDIRECT_URL =
  process.env.SETU_REDIRECT_URL ||
  "http://localhost:3000/financial-data?consent_status=success";

// ── Default FI types & consent config ────────────────────────────────────

const DEFAULT_FI_TYPES = [
  "DEPOSIT",
  "TERM_DEPOSIT",
  "RECURRING_DEPOSIT",
  "IDR",
  "INSURANCE_POLICIES",
  "GENERAL_INSURANCE",
  "LIFE_INSURANCE",
  "MUTUAL_FUNDS",
  "BONDS",
  "DEBENTURES",
  "ETF",
  "NPS",
  "GOVT_SECURITIES",
  "CP",
  "REIT",
  "INVIT",
  "AIF",
  "SIP",
  "EQUITIES",
  "CIS",
  "GSTR1_3B",
];
const DEFAULT_CONSENT_TYPES = ["PROFILE", "SUMMARY", "TRANSACTIONS"];

// ── Helpers ──────────────────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-client-id": SETU_CLIENT_ID,
    "x-client-secret": SETU_CLIENT_SECRET,
    "x-product-instance-id": SETU_PRODUCT_INSTANCE_ID,
  };
}

async function setuFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SETU_BASE_URL}/v2${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `SETU API error [${res.status}] ${path}: ${body}`
    );
  }

  return res.json() as Promise<T>;
}

// ── Consent APIs ─────────────────────────────────────────────────────────

/**
 * Create a consent request for a user's mobile number.
 * Returns consent id + redirect URL for the SETU approval screens.
 */
export async function createConsent(
  mobileNumber: string,
  customRedirectUrl?: string,
  fiTypes: string[] = DEFAULT_FI_TYPES
): Promise<SetuConsentResponse> {
  // Build data range: 1 year back to today
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  const body = {
    consentDuration: {
      unit: "MONTH",
      value: "6",
    },
    vua: mobileNumber, // SETU routes to best AA automatically
    dataRange: {
      from: oneYearAgo.toISOString(),
      to: now.toISOString(),
    },
    context: [],
    redirectUrl: customRedirectUrl || SETU_REDIRECT_URL,
    fiTypes,
    consentTypes: DEFAULT_CONSENT_TYPES,
    fetchType: "PERIODIC",
    purpose: {
      code: "101",
      text: "Wealth management service",
      refUri: "https://api.rebit.org.in/aa/purpose/101.xml",
      category: { type: "string" },
    },
    dataLife: {
      unit: "DAY",
      value: 30,
    },
    frequency: {
      unit: "DAY",
      value: 2,
    },
  };

  return setuFetch<SetuConsentResponse>("/consents", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Get the status of a previously created consent request.
 */
export async function getConsentStatus(
  consentId: string
): Promise<SetuConsentResponse> {
  return setuFetch<SetuConsentResponse>(
    `/consents/${consentId}?expanded=true`
  );
}

// ── Data Session APIs ────────────────────────────────────────────────────

/**
 * Create a data session to fetch FI data for an approved consent.
 * Fetches the consent first to use its exact dataRange.
 */
export async function createDataSession(
  consentId: string
): Promise<SetuDataSessionResponse> {
  // Fetch the consent to get its exact dataRange
  const consent = await getConsentStatus(consentId);
  const consentDataRange = consent.detail?.dataRange;

  if (!consentDataRange) {
    throw new Error("Could not retrieve consent dataRange");
  }

  const body = {
    consentId,
    dataRange: {
      from: consentDataRange.from,
      to: consentDataRange.to,
    },
    format: "json",
  };

  return setuFetch<SetuDataSessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Get data session status + data.
 * GET /sessions/:id
 * Returns full raw response — FI data is included when status is COMPLETED/PARTIAL.
 */
export async function getDataSession(
  sessionId: string
): Promise<any> {
  const result = await setuFetch<any>(`/sessions/${sessionId}`);
  // Log full response to help identify actual data fields
  console.log("[SETU] GET /sessions response keys:", Object.keys(result));
  console.log("[SETU] GET /sessions full response:", JSON.stringify(result, null, 2));
  return result;
}
