export type Mode = "live" | "sandbox" | "testnet" | "simulated" | "snapshot";

export interface ApiError {
  error: {
    code:
      | "bad_request"
      | "unauthorized"
      | "forbidden"
      | "not_found"
      | "outside_coverage"
      | "price_stale"
      | "price_unavailable"
      | "asset_unavailable"
      | "provider_unavailable"
      | "rate_limited"
      | "wrong_pin"
      | "wallet_locked"
      | "wallet_not_ready"
      | "internal";
    message: string; // safe to show to the user
    detail?: Record<string, unknown>;
  };
}

// ---------- Pricing ----------

export type AssetSymbol = "USDT" | "USDC" | "BNB";

export interface PriceSource {
  /** e.g. "atlas", "coinmarketcap" */
  provider: string;
  /** Human label, e.g. "Atlas USD/THB feed #1187 (BSC Testnet)" */
  label: string;
  feedId?: number;
  contract?: string;
  chainId?: number;
  blockNumber?: number;
  roundId?: string;
  /** Raw integer answer as a decimal string, plus its decimals */
  rawAnswer?: string;
  decimals?: number;
  /** Decoded price, as a decimal string, in the units stated by `pair` */
  price: string;
  /** "USD/THB" means THB per 1 USD */
  pair: string;
  updatedAt: string; // when the source says the price was updated
  fetchedAt: string; // when we read it
  ageSeconds: number;
  maxAgeSeconds: number;
  fresh: boolean;
  url?: string;
  mode: Mode;
}

export interface AssetAvailability {
  asset: AssetSymbol;
  /** "bsc" (mainnet, chain 56) in production; "bsc-testnet" (chain 97) in test mode */
  network: "bsc-testnet" | "bsc";
  chainId: 97 | 56;
  /** Token contract; null for native BNB */
  tokenContract: string | null;
  available: boolean;
  reason?: string; // shown when unavailable
}

export interface MarketEstimate {
  asset: AssetSymbol;
  /** Estimated asset units needed for the target THB, before provider fees */
  assetAmount: string;
  usdAmount: string;
  /** Forward check: assetAmount * usdPerAsset * usdThb */
  forwardThb: string;
  fx: PriceSource; // THB/USD (feed 1186) used for the estimate
  fxForward: PriceSource; // USD/THB (feed 1187) used for the forward check
  assetUsd: PriceSource;
  disabled: boolean;
  disabledReason?: string;
}

export interface ExecutableQuote {
  provider: "moneygram";
  mode: Mode; // "sandbox" when it came from the MoneyGram sandbox
  quoteId?: string;
  sendAsset: "USDC";
  sendNetwork: "stellar-testnet" | "stellar";
  sendAmount?: string;
  receiveCurrency: string;
  receiveAmount?: string;
  fees: { label: string; amount: string; currency: string }[];
  expiresAt?: string;
  available: boolean;
  /** Why no executable quote is shown (e.g. quote is issued inside the provider UI) */
  note?: string;
}

export interface QuoteResponse {
  quoteId: string; // "q_..."
  targetThb: string;
  createdAt: string;
  estimates: MarketEstimate[]; // one per asset
  assets: AssetAvailability[];
  executable: ExecutableQuote;
  /** Present only when a non-production test override was applied (e.g. ?simulateStale=1). */
  test?: { simulateStale: boolean; note: string };
}

// ---------- Locations ----------

export interface SearchCenter {
  id: string; // "park-hyatt-bangkok" by default
  label: string; // "Park Hyatt Bangkok"
  lat: number;
  lng: number;
  /** "default" = demo default, never presented as the user's detected position */
  origin: "default" | "manual" | "device";
  inCoverage: boolean;
}

export type HoursKnowledge = "known" | "unknown";

export interface DayHours {
  knowledge: HoursKnowledge;
  /** Bangkok local time, 24h "HH:MM" */
  open?: string;
  close?: string;
  closedToday?: boolean;
  source?: string;
  verifiedAt?: string;
}

export interface BranchObservation {
  id: string; // "obs_..."
  branchId: string;
  kind: "counter_closed_early" | "pickup_succeeded" | "long_wait" | "no_cash" | "other";
  text: string;
  observedAt: string;
  source: "rozo_traveler"; // opt-in ROZO traveler report, never a third-party review
  /**
   * Where it was retrieved from. "backend_pending_sync" = accepted by Living Brain but not yet
   * searchable there (async compile), so this copy was read from the ROZO backend.
   */
  store: "living_brain" | "local_sample" | "backend_pending_sync";
  mode: Mode;
  /** Structured "Update counter info" fields; present only when the traveler filled them in. */
  floor?: string;
  /** "HH:MM", 24h, Bangkok local time */
  opensAt?: string;
  /** "HH:MM", 24h, Bangkok local time */
  closesAt?: string;
}

export interface Branch {
  /** Stable ROZO id: "mg_<official id>" or "sample_<n>" */
  id: string;
  officialId: string | null;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Position in THIS result set, starting at 1. Never use as an identifier. */
  number: number;
  distanceMeters: number;
  walkMinutes: number | null;
  etaSource: "straight_line_estimate" | "routes_api" | null;
  routeUrl: string;
  /** Google Maps link that opens this counter (no API key). Optional for older fixtures. */
  mapsUrl?: string;
  cashOutStatus: "confirmed" | "candidate" | "sample";
  serviceTypes: string[];
  counterHours: DayHours; // cash-counter hours today
  storeHours: DayHours; // general store hours today
  dataSource: string;
  verifiedAt: string | null;
  mode: Mode;
  /**
   * Latest time we know a pickup succeeded here: a shared pickup_succeeded traveler report or a
   * collected ROZO order at this counter. Absent when we know of none.
   */
  lastUsedAt?: string | null;
}

export interface Recommendation {
  branchId: string;
  reason: string;
  /** Set when a traveler observation moved the recommendation */
  alternativeToBranchId?: string;
  basedOnObservationIds: string[];
}

export interface LocationsResponse {
  resultSetId: string; // "rs_..."
  center: SearchCenter;
  generatedAt: string;
  branches: Branch[];
  recommendation: Recommendation | null;
  observations: BranchObservation[];
}
