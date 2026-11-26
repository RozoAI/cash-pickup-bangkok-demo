import type { Branch, BranchObservation, Recommendation } from "../../shared/contracts.ts";

/** Reports older than this no longer move the recommendation. */
export const REPORT_WINDOW_MS = 48 * 3600 * 1000;
const NEGATIVE: BranchObservation["kind"][] = ["counter_closed_early", "no_cash"];

const KIND_TEXT: Record<BranchObservation["kind"], string> = {
  counter_closed_early: "the cash counter closed early",
  no_cash: "the counter had no cash to pay out",
  pickup_succeeded: "they collected cash there",
  long_wait: "there was a long wait",
  other: "there was a problem",
};

export function bangkokDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

const isRecent = (o: BranchObservation, now: number) => {
  const t = Date.parse(o.observedAt);
  return Number.isFinite(t) && now - t <= REPORT_WINDOW_MS && t - now <= 5 * 60_000;
};

const statusLabel = (b: Branch) =>
  b.cashOutStatus === "confirmed"
    ? "a confirmed cash-out location"
    : b.cashOutStatus === "candidate"
      ? `listed by MoneyGram's public locator with "Receive money" (a candidate; this cash-out route is not individually verified there)`
      : "a sample location";

const place = (b: Branch) => `counter ${b.number} (${b.name}, about ${b.distanceMeters} m away)`;

/**
 * Default: nearest branch. If the nearest has a recent (<= 48 h) negative traveler report,
 * recommend the nearest branch without one. Reports never change any branch's hours.
 * `branches` must be sorted by distance.
 */
export function recommend(branches: Branch[], observations: BranchObservation[], now = Date.now()): Recommendation | null {
  const nearest = branches[0];
  if (!nearest) return null;
  const recent = observations.filter((o) => isRecent(o, now));
  const negatives = (id: string) =>
    recent.filter((o) => o.branchId === id && NEGATIVE.includes(o.kind)).sort((a, b) => b.observedAt.localeCompare(a.observedAt));
  const successes = (id: string) => recent.filter((o) => o.branchId === id && o.kind === "pickup_succeeded");

  const nearestBad = negatives(nearest.id);
  if (nearestBad.length === 0) {
    const ok = successes(nearest.id);
    return {
      branchId: nearest.id,
      reason:
        `Counter ${nearest.number} (${nearest.name}) is the nearest, about ${nearest.distanceMeters} m away. It is ${statusLabel(nearest)}.` +
        (ok[0] ? ` A ROZO traveler reported collecting cash there on ${bangkokDateTime(ok[0].observedAt)} Bangkok time (a single report).` : ""),
      basedOnObservationIds: ok.slice(0, 1).map((o) => o.id),
    };
  }

  const report = nearestBad[0]!;
  const reportText =
    `A single ROZO traveler reported on ${bangkokDateTime(report.observedAt)} Bangkok time that ${KIND_TEXT[report.kind]} at ${place(nearest)}. ` +
    `This is one traveler's report, not official opening hours.`;
  const alt = branches.slice(1).find((b) => negatives(b.id).length === 0);
  if (!alt) {
    return {
      branchId: nearest.id,
      reason: `${reportText} Every other counter nearby also has a recent report, so the nearest is still shown first. Consider checking with the counter before you go.`,
      basedOnObservationIds: [report.id],
    };
  }
  const altOk = successes(alt.id)[0];
  return {
    branchId: alt.id,
    alternativeToBranchId: nearest.id,
    reason:
      `${reportText} We suggest ${place(alt)} instead, which has no such report. It is ${statusLabel(alt)}.` +
      (altOk ? ` A ROZO traveler reported collecting cash there on ${bangkokDateTime(altOk.observedAt)} Bangkok time (a single report).` : ""),
    basedOnObservationIds: [report.id, ...(altOk ? [altOk.id] : [])],
  };
}
