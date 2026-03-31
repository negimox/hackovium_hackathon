// ========== Consent Request/Response ==========

export interface SetuConsentRequest {
  consentDuration: {
    unit: "MONTH" | "YEAR" | "DAY";
    value: string;
  };
  vua: string; // mobile number or mobile@handle
  dataRange: {
    from: string; // ISO 8601
    to: string;
  };
  context: Array<{ key: string; value: string }>;
  redirectUrl?: string;
  fiTypes?: string[];
  consentTypes?: string[];
  fetchType?: "ONETIME" | "PERIODIC";
  purpose?: {
    code: string;
    text: string;
    refUri: string;
    category: { type: string };
  };
  dataLife?: {
    unit: "MONTH" | "YEAR" | "DAY" | "INF";
    value: number;
  };
  frequency?: {
    unit: "HOUR" | "DAY" | "MONTH" | "YEAR" | "INF";
    value: number;
  };
}

export interface SetuConsentResponse {
  id: string;
  url: string;
  status: ConsentStatus;
  detail?: {
    consentStart: string;
    fiTypes: string[];
    fetchType: string;
    purpose: {
      category: { type: string };
      refUri: string;
      code: string;
      text: string;
    };
    vua: string;
    dataRange: {
      from: string;
      to: string;
    };
    consentTypes: string[];
    consentMode: string;
    consentExpiry: string;
    frequency: {
      value: number;
      unit: string;
    };
    dataLife: {
      value: number;
      unit: string;
    };
  };
  redirectUrl?: string;
  context: Array<{ key: string; value: string }>;
  usage?: {
    count: string;
    lastUsed: string | null;
  };
  tags?: string[];
  traceId: string;
}

export type ConsentStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "REVOKED"
  | "EXPIRED"
  | "PAUSED";

// ========== Data Session ==========

export interface SetuDataSessionRequest {
  consentId: string;
  dataRange: {
    from: string;
    to: string;
  };
  format: "json" | "xml";
}

export interface SetuDataSessionResponse {
  id: string;
  consentId: string;
  status: DataSessionStatus;
  format: string;
  dataRange: {
    from: string;
    to: string;
  };
  Payload?: SetuFIDataPayload[];
  traceId: string;
}

export type DataSessionStatus =
  | "PENDING"
  | "PARTIAL"
  | "COMPLETED"
  | "EXPIRED"
  | "FAILED";

// ========== Financial Information Data ==========

export interface SetuFIDataPayload {
  fipId: string;
  data: SetuFIAccount[];
}

export interface SetuFIAccount {
  linkRefNumber: string;
  maskedAccNumber: string;
  fiType: string;
  account: {
    linkedAccRef: string;
    maskedAccNumber: string;
    type: string;
    Profile?: {
      Holders?: {
        Holder?: Array<{
          name: string;
          email?: string;
          mobile?: string;
          pan?: string;
          dob?: string;
        }>;
      };
    };
    Summary?: {
      currentBalance?: string;
      currency?: string;
      branch?: string;
      ifscCode?: string;
      // Mutual Fund / Equities specific
      investmentValue?: string;
      currentValue?: string;
      totalNumUnits?: string;
    };
    Transactions?: {
      Transaction?: Array<{
        txnId: string;
        type: "DEBIT" | "CREDIT";
        mode: string;
        amount: string;
        currentBalance?: string;
        transactionTimestamp: string;
        narration: string;
        reference?: string;
      }>;
    };
  };
}

// ========== Webhook Notification ==========

export interface SetuNotification {
  type: "CONSENT_STATUS_UPDATE" | "FI_DATA_READY" | "SESSION_STATUS_UPDATE";
  timestamp: string;
  consentId?: string;
  consentStatus?: ConsentStatus;
  dataSessionId?: string;
  dataSessionStatus?: DataSessionStatus;
  notificationId: string;
}

// ========== Client-side state types ==========

export type FinancialFlowStep =
  | "form"
  | "consent_pending"
  | "consent_approved"
  | "fetching_data"
  | "data_loaded"
  | "error";

export interface FinancialDataState {
  step: FinancialFlowStep;
  consentId: string | null;
  consentUrl: string | null;
  consentStatus: ConsentStatus | null;
  dataSessionId: string | null;
  fiData: SetuFIDataPayload[] | null;
  error: string | null;
}
