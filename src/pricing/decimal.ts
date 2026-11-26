// Exact decimal arithmetic on strings via BigInt. No floating point anywhere in the price path.

export interface Dec {
  /** Unscaled integer value */
  v: bigint;
  /** Number of fractional digits */
  s: number;
}

const DEC_RE = /^(-?)(\d+)(?:\.(\d+))?$/;

export function parseDec(text: string): Dec {
  const m = DEC_RE.exec(text.trim());
  if (!m) throw new Error(`not a decimal: ${text}`);
  const frac = m[3] ?? "";
  const v = BigInt((m[2] ?? "0") + frac);
  return { v: m[1] === "-" ? -v : v, s: frac.length };
}

/** A raw on-chain integer with `decimals` fractional digits. */
export function fromRaw(raw: bigint, decimals: number): Dec {
  return { v: raw, s: decimals };
}

export function mul(a: Dec, b: Dec): Dec {
  return { v: a.v * b.v, s: a.s + b.s };
}

const pow10 = (n: number) => 10n ** BigInt(n);

/** a / b rounded to `scale` fractional digits. `mode` "up" rounds away from zero, "half" rounds half up. */
export function div(a: Dec, b: Dec, scale: number, mode: "up" | "half" | "down" = "half"): Dec {
  if (b.v === 0n) throw new Error("division by zero");
  // a.v/10^a.s / (b.v/10^b.s) = a.v * 10^b.s / (b.v * 10^a.s); scaled by 10^scale
  let num = a.v * pow10(b.s + scale);
  let den = b.v * pow10(a.s);
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const neg = num < 0n;
  const absNum = neg ? -num : num;
  let q = absNum / den;
  const r = absNum % den;
  if (r !== 0n) {
    if (mode === "up") q += 1n;
    else if (mode === "half" && r * 2n >= den) q += 1n;
  }
  return { v: neg ? -q : q, s: scale };
}

/** Rescale to `scale` digits. */
export function round(a: Dec, scale: number, mode: "up" | "half" | "down" = "half"): Dec {
  if (scale >= a.s) return { v: a.v * pow10(scale - a.s), s: scale };
  return div(a, { v: 1n, s: 0 }, scale, mode);
}

export function toStr(a: Dec): string {
  const neg = a.v < 0n;
  let digits = (neg ? -a.v : a.v).toString();
  if (a.s === 0) return (neg ? "-" : "") + digits;
  digits = digits.padStart(a.s + 1, "0");
  const int = digits.slice(0, digits.length - a.s);
  const frac = digits.slice(digits.length - a.s);
  return `${neg ? "-" : ""}${int}.${frac}`;
}

/** Drop trailing fractional zeros (display only). */
export function trim(text: string): string {
  return text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
}

export const isPositive = (a: Dec) => a.v > 0n;
