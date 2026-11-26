// Lightweight intent detection for free-text messages. Never infers location from
// language, nationality or anything else: only from what the user explicitly says.

export type Intent =
  | { kind: "elsewhere"; place: string | null }
  | { kind: "use_default" }
  | { kind: "help" }
  | { kind: "other" };

const ELSEWHERE =
  /\b(somewhere else|elsewhere|another (place|area|location)|different (place|area|location)|change (the |my )?(location|place|area)|not (at|near|in) (the )?park hyatt|search (somewhere|another|near))\b/i;
const PLACE = /\b(?:i'?m|i am|we'?re|we are|staying)\s+(?:now\s+)?(?:at|in|near|around|staying at)\s+(?:the\s+)?([^,.!?\n]{2,60})/i;
const NEAR = /^\s*(?:near|around|at)\s+(?:the\s+)?([^,.!?\n]{2,60})\s*$/i;
const USE_DEFAULT = /\b(park hyatt|phloen chit|ploenchit|use (the )?default|bangkok demo)\b/i;
const HELP = /^\s*(help|\?|what can you do|how does (this|it) work)\b/i;

function cleanPlace(raw: string): string | null {
  const p = raw
    .replace(/\b(and|but)\b.*$/i, "")
    .replace(/\b(right now|now|today)\b/gi, "")
    .trim();
  if (p.length < 2) return null;
  if (/\d[\d,.]*\s*(k\b)?\s*(baht|thb|บาท)/i.test(p) || /^need\b/i.test(p)) return null;
  if (/^(somewhere else|elsewhere|another place|a different place)$/i.test(p)) return null;
  return p;
}

export function detectIntent(text: string): Intent {
  const t = (text ?? "").slice(0, 300);
  const place = PLACE.exec(t) ?? NEAR.exec(t);
  if (place?.[1]) {
    const cleaned = cleanPlace(place[1]);
    if (cleaned && USE_DEFAULT.test(cleaned)) return { kind: "use_default" };
    if (cleaned) return { kind: "elsewhere", place: cleaned };
  }
  if (ELSEWHERE.test(t)) return { kind: "elsewhere", place: null };
  if (HELP.test(t)) return { kind: "help" };
  return { kind: "other" };
}
