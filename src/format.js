import { scoreFifteens, scorePairs, scoreRuns } from "./engine.js";

// ─── Shared formatting / scoring-display helpers ─────────────────────────────

/**
 * A short plain-language reason a 4-card keep is strong, so the discard grade
 * teaches *why*, not just by how much EV. Inspects the kept cards' own
 * structure (no cut). Returns "" when nothing notable stands out.
 * @param {{ rank: string, suit: string }[]} keep @returns {string}
 */
export function describeKeep(keep) {
  if (!keep || keep.length !== 4) return "";
  const features = [];

  const pairPts = scorePairs(keep).pts;
  if (pairPts >= 12) features.push("four of a kind");
  else if (pairPts >= 6) features.push("three of a kind");
  else if (pairPts >= 4) features.push("two pairs");
  else if (pairPts >= 2) features.push("a pair");

  if (scoreRuns(keep).pts > 0) features.push("a run");

  const fifteens = scoreFifteens(keep).pts / 2;
  if (fifteens === 1) features.push("a fifteen");
  else if (fifteens > 1) features.push(`${fifteens} fifteens`);

  const suitOf = keep[0].suit;
  if (keep.every(c => c.suit === suitOf)) features.push("four to a flush");

  const fives = keep.filter(c => c.rank === "5").length;
  if (fives > 0 && pairPts < 2) features.push(fives === 1 ? "a 5 (pairs with every 10-card)" : "multiple 5s");

  if (features.length === 0) return "Connected cards that lean on the cut for points.";
  return "Keeps " + features.slice(0, 3).join(", ") + ".";
}

/** @type {Record<string, string>} */
const RANK_NAMES = { A: "Ace", J: "Jack", Q: "Queen", K: "King" };
/** @type {Record<string, string>} */
const SUIT_NAMES = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };

/**
 * Spoken label for a card, e.g. "Five of hearts" — for aria-label / SR text.
 * @param {{ rank: string, suit: string }} card @returns {string}
 */
export function cardLabel(card) {
  if (!card) return "empty card slot";
  return `${RANK_NAMES[card.rank] ?? card.rank} of ${SUIT_NAMES[card.suit] ?? card.suit}`;
}

/**
 * Efficiency as a 0–100 integer percentage, clamped at 100. Returns `fallback`
 * when there's nothing to divide by (no optimal points yet).
 * @param {number} your @param {number} opt @param {number} [fallback=100]
 * @returns {number}
 */
export function efficiencyPct(your, opt, fallback = 100) {
  return opt > 0 ? Math.min(100, Math.round((your / opt) * 100)) : fallback;
}

/**
 * Map an efficiency percentage to its tier-grade color.
 * 90+ strong (green), 75–89 good (gold), 60–74 fair, <60 poor.
 * @param {number} efficiency @param {{ tierGrade: string[] }} t
 * @returns {string}
 */
export function tierColor(efficiency, t) {
  if (efficiency >= 90) return t.tierGrade[3];
  if (efficiency >= 75) return t.tierGrade[2];
  if (efficiency >= 60) return t.tierGrade[1];
  return t.tierGrade[0];
}
