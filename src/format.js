// ─── Shared formatting / scoring-display helpers ─────────────────────────────

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
