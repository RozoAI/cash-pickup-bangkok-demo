// Natural-language THB amount parsing shared by the bot and the Mini App.
// Accepts "1,000 baht", "1000 THB", "฿500", "pick up 2k baht", "1.5k", "500 บาท" and a bare "1000".

export const MIN_THB = 100;
export const MAX_THB = 50_000;

export type AmountParse =
  | { ok: true; thb: number }
  | { ok: false; reason: "no_amount" | "wrong_currency" | "too_small" | "too_large" | "ambiguous" };

const CURRENCY_AFTER = /^\s*(baht|bht|thb|บาท)\b/i;
const CURRENCY_AFTER_THAI = /^\s*บาท/;
const FOREIGN = /(\$|€|£|\b(usd|usdt|usdc|bnb|dollars?|euros?|eur|gbp|pounds?)\b)/i;

interface NumberToken {
  value: number;
  start: number;
  end: number;
  currencyTagged: boolean;
  foreignTagged: boolean;
}

function scan(text: string): NumberToken[] {
  const tokens: NumberToken[] = [];
  // Digits with optional thousands separators and decimals, optional k / thousand multiplier.
  const re = /(฿\s*)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*(k\b|thousand\b)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const [whole, baht, intPart, dec, mult] = m;
    let value = Number(`${intPart!.replace(/,/g, "")}${dec ?? ""}`);
    if (mult) value *= 1000;
    const end = m.index + whole.length;
    const after = text.slice(end);
    const before = text.slice(Math.max(0, m.index - 6), m.index);
    const currencyTagged = Boolean(baht) || CURRENCY_AFTER.test(after) || CURRENCY_AFTER_THAI.test(after) || /thb\s*$/i.test(before);
    const foreignTagged =
      /^\s*(usd|usdt|usdc|bnb|dollars?|euros?|eur|gbp|pounds?)\b/i.test(after) || /[$€£]\s*$/.test(before);
    tokens.push({ value, start: m.index, end, currencyTagged, foreignTagged });
  }
  return tokens;
}

export function parseAmount(input: string): AmountParse {
  const text = (input ?? "").normalize("NFKC").slice(0, 500);
  const tokens = scan(text).filter((t) => Number.isFinite(t.value));
  if (tokens.length === 0) return { ok: false, reason: "no_amount" };

  const tagged = tokens.filter((t) => t.currencyTagged);
  let chosen: NumberToken | undefined;
  if (tagged.length === 1) chosen = tagged[0];
  else if (tagged.length > 1) return { ok: false, reason: "ambiguous" };
  else {
    if (tokens.some((t) => t.foreignTagged) || FOREIGN.test(text)) return { ok: false, reason: "wrong_currency" };
    const plain = tokens.filter((t) => !t.foreignTagged);
    if (plain.length !== 1) return { ok: false, reason: plain.length === 0 ? "no_amount" : "ambiguous" };
    chosen = plain[0];
  }
  const thb = Math.round(chosen!.value);
  if (thb < MIN_THB) return { ok: false, reason: "too_small" };
  if (thb > MAX_THB) return { ok: false, reason: "too_large" };
  return { ok: true, thb };
}

export function amountErrorMessage(reason: Exclude<AmountParse, { ok: true }>["reason"]): string {
  switch (reason) {
    case "wrong_currency":
      return "I work in Thai baht. How many baht do you need? For example: 1,000 baht.";
    case "too_small":
      return `The smallest pickup is ${MIN_THB.toLocaleString("en-US")} baht. How much would you like?`;
    case "too_large":
      return `The most per pickup is ${MAX_THB.toLocaleString("en-US")} baht. Please send a smaller amount.`;
    case "ambiguous":
      return "I saw more than one amount. Please send just one, for example: 1,000 baht.";
    default:
      return "How many baht would you like to pick up? For example: 1,000 baht.";
  }
}
