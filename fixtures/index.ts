// Clearly labeled sample data for the credential-free demo and for building the UI
// before live integrations land. Every object carries mode: "simulated".
import type {
  Branch, BranchObservation, LocationsResponse, PriceSource, QuoteResponse, SearchCenter,
} from "../shared/contracts.ts";

const T = "2026-11-25T12:51:10.000Z";

export const defaultCenter: SearchCenter = {
  id: "park-hyatt-bangkok", label: "Park Hyatt Bangkok", lat: 13.7437, lng: 100.5469, origin: "default", inCoverage: true,
};

const src = (over: Partial<PriceSource>): PriceSource => ({
  provider: "sample", label: "Sample price (simulated)", price: "1", pair: "USD/USD", updatedAt: T, fetchedAt: T,
  ageSeconds: 0, maxAgeSeconds: 86400, fresh: true, mode: "simulated", ...over,
});
const thbUsd = src({ label: "Sample THB/USD (simulated)", pair: "THB/USD", price: "0.029304" });
const usdThb = src({ label: "Sample USD/THB (simulated)", pair: "USD/THB", price: "34.1251" });

export const quoteFixture: QuoteResponse = {
  quoteId: "q_sample0001", targetThb: "1000", createdAt: T,
  estimates: [
    { asset: "USDT", assetAmount: "29.30", usdAmount: "29.30", forwardThb: "1000.00", fx: thbUsd, fxForward: usdThb,
      assetUsd: src({ pair: "USDT/USD", price: "1.0000", label: "Sample USDT/USD (simulated)" }), disabled: false },
    { asset: "USDC", assetAmount: "29.30", usdAmount: "29.30", forwardThb: "1000.00", fx: thbUsd, fxForward: usdThb,
      assetUsd: src({ pair: "USDC/USD", price: "1.0000", label: "Sample USDC/USD (simulated)" }), disabled: false },
    { asset: "BNB", assetAmount: "0", usdAmount: "29.30", forwardThb: "0", fx: thbUsd, fxForward: usdThb,
      assetUsd: src({ pair: "BNB/USD", price: "0", fresh: false, label: "No fresh BNB/USD source" }),
      disabled: true, disabledReason: "No fresh BNB price source is available right now." },
  ],
  assets: [
    { asset: "USDT", network: "bsc-testnet", chainId: 97, tokenContract: null, available: true },
    { asset: "USDC", network: "bsc-testnet", chainId: 97, tokenContract: null, available: true },
    { asset: "BNB", network: "bsc-testnet", chainId: 97, tokenContract: null, available: false, reason: "Not enabled yet." },
  ],
  executable: { provider: "moneygram", mode: "simulated", sendAsset: "USDC", sendNetwork: "stellar-testnet",
    receiveCurrency: "THB", fees: [], available: false,
    note: "The executable quote and fees are confirmed inside the MoneyGram sandbox screen." },
};

const branch = (n: number, over: Partial<Branch>): Branch => ({
  id: `sample_${n}`, officialId: null, name: `Sample counter ${n}`, address: "Bangkok (sample)", lat: 13.744, lng: 100.547,
  number: n, distanceMeters: 300 * n, walkMinutes: 4 * n, etaSource: "straight_line_estimate",
  routeUrl: "https://www.google.com/maps/dir/?api=1&destination=13.744,100.547&travelmode=walking",
  cashOutStatus: "sample", serviceTypes: ["receive_money"],
  counterHours: { knowledge: "unknown" }, storeHours: { knowledge: "unknown" },
  dataSource: "Sample data (not a verified MoneyGram location)", verifiedAt: null, mode: "simulated", ...over,
});

export const branchesFixture: Branch[] = [
  branch(1, { name: "Sample counter A, Phloen Chit", counterHours: { knowledge: "known", open: "10:00", close: "18:00", source: "sample", verifiedAt: T },
    storeHours: { knowledge: "known", open: "10:00", close: "22:00", source: "sample", verifiedAt: T } }),
  branch(2, { name: "Sample counter B, Chit Lom", lat: 13.7445, lng: 100.5435 }),
  branch(3, { name: "Sample counter C, Nana", lat: 13.7405, lng: 100.5553 }),
];

export const observationsFixture: BranchObservation[] = [
  { id: "obs_sample0001", branchId: "sample_1", kind: "counter_closed_early", text: "The cash counter closed before the store.",
    observedAt: T, source: "rozo_traveler", store: "local_sample", mode: "simulated" },
];

export const locationsFixture: LocationsResponse = {
  resultSetId: "rs_sample0001", center: defaultCenter, generatedAt: T, branches: branchesFixture,
  recommendation: { branchId: "sample_2", alternativeToBranchId: "sample_1", basedOnObservationIds: ["obs_sample0001"],
    reason: "A traveler reported today that counter 1 closed early, so counter 2 is the safer choice." },
  observations: observationsFixture,
};
