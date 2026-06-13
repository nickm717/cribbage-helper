// ─── Shared game logic ──────────────────────────────────────────────────────
//
// Pure cribbage domain logic. No UI, no React, no side effects. Everything in
// this module is deterministic and unit-testable in isolation.

/**
 * @typedef {"A"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"10"|"J"|"Q"|"K"} Rank
 * @typedef {"♠"|"♥"|"♦"|"♣"} Suit
 * @typedef {{ rank: Rank, suit: Suit }} Card
 * @typedef {{ pts: number, reason: string, cards: Card[] }} ScorePart
 * @typedef {{ pts: number, log: ScorePart[] }} ScoreResult
 * @typedef {{ total: number, log: ScorePart[] }} HandScore
 */

/** @type {Rank[]} */
export const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
/** @type {Suit[]} */
export const SUITS = ["♠","♥","♦","♣"];

// Pre-computed pegging value for every rank. A=1, face cards=10, else the
// numeric value. A lookup makes cardValue total over the Rank union (no
// reliance on parseInt for "J"/"Q"/"K", which would be NaN).
/** @type {Record<Rank, number>} */
const CARD_VALUE = {
  A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 10, Q: 10, K: 10,
};

/** Pegging value of a rank (A=1, face=10). @param {Rank} r @returns {number} */
export function cardValue(r) { return CARD_VALUE[r] ?? 0; }
/** Run-ordering index of a rank (A low, K high). @param {Rank} r */
export function rankIdx(r) { return RANKS.indexOf(r); }
/** @param {Suit} s */
export function isRed(s) { return s === "♥" || s === "♦"; }
/** Stable identity key for a card. @param {Card} c */
export function cardKey(c) { return c.rank + c.suit; }

// Cached constant — the deck never changes so there's no reason to rebuild it
// on every call. fullDeck() returns this reference for backward compatibility.
/** @type {readonly Card[]} */
const FULL_DECK = SUITS.flatMap(s => RANKS.map(r => ({ rank: r, suit: s })));
/** The canonical 52-card deck (shared reference). @returns {readonly Card[]} */
export function fullDeck() { return FULL_DECK; }

/**
 * Return a new array that is a uniformly-random permutation of `arr`
 * (Fisher–Yates). `sort(() => Math.random() - 0.5)` is biased and relies on
 * comparator consistency the spec doesn't guarantee, so it isn't used here.
 * @template T @param {readonly T[]} arr @returns {T[]}
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * All size-`size` combinations of `arr`, order-independent.
 * @template T @param {T[]} arr @param {number} size @returns {T[][]}
 */
export function combos(arr, size) {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const [first, ...rest] = arr;
  return [...combos(rest, size - 1).map(c => [first, ...c]), ...combos(rest, size)];
}

/** Score every 15-summing subset (2 pts each). @param {Card[]} cards @returns {ScoreResult} */
export function scoreFifteens(cards) {
  let pts = 0;
  /** @type {ScorePart[]} */
  const log = [];
  for (let sz = 2; sz <= 5; sz++)
    combos(cards, sz).forEach(combo => {
      if (combo.reduce((s, c) => s + cardValue(c.rank), 0) === 15)
        { pts += 2; log.push({ pts: 2, reason: "Fifteen", cards: combo }); }
    });
  return { pts, log };
}

/**
 * Score pairs / sets. Cards are grouped by rank and each rank with two or more
 * cards yields its own row: a pair is 2 pts, three of a kind 6 (3 pairs),
 * four of a kind 12 (6 pairs). One row per rank group so the breakdown names
 * exactly what scored — two distinct pairs are two rows, not one "four of a
 * kind". @param {Card[]} cards @returns {ScoreResult}
 */
export function scorePairs(cards) {
  /** @type {Map<Rank, Card[]>} */
  const byRank = new Map();
  for (const c of cards) {
    const g = byRank.get(c.rank);
    if (g) g.push(c); else byRank.set(c.rank, [c]);
  }
  let pts = 0;
  /** @type {ScorePart[]} */
  const log = [];
  // Iterate in canonical rank order for a stable, readable breakdown.
  for (const rank of RANKS) {
    const group = byRank.get(rank);
    if (!group || group.length < 2) continue;
    const n = group.length;
    const groupPts = n * (n - 1); // C(n,2) * 2
    const reason = n === 2 ? "Pair" : n === 3 ? "Three of a Kind" : "Four of a Kind";
    pts += groupPts;
    log.push({ pts: groupPts, reason, cards: group });
  }
  return { pts, log };
}

/** Score the longest runs present (each run worth its length). @param {Card[]} cards @returns {ScoreResult} */
export function scoreRuns(cards) {
  let pts = 0;
  /** @type {ScorePart[]} */
  const log = [];
  for (let sz = 5; sz >= 3; sz--) {
    /** @type {Card[][]} */
    const runs = [];
    combos(cards, sz).forEach(combo => {
      const idxs = combo.map(c => rankIdx(c.rank)).sort((a, b) => a - b);
      if (idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1)) runs.push(combo);
    });
    if (runs.length) { runs.forEach(r => { pts += sz; log.push({ pts: sz, reason: `Run of ${sz}`, cards: r }); }); break; }
  }
  return { pts, log };
}

/**
 * Score a flush. A 4-card hand flush scores 4 (5 with a matching cut); the crib
 * only ever scores a flush when all five cards (hand + cut) share a suit.
 * @param {Card[]} hand4 @param {Card|null} starter @param {boolean} isCrib @returns {ScoreResult}
 */
export function scoreFlush(hand4, starter, isCrib) {
  // Precondition: a flush requires the full 4-card hand. Guard so a partial
  // hand can never spuriously "flush" on fewer matching cards.
  if (hand4.length !== 4) return { pts: 0, log: [] };
  const s = hand4[0].suit;
  if (!hand4.every(c => c.suit === s)) return { pts: 0, log: [] };
  if (starter?.suit === s) return { pts: 5, log: [{ pts: 5, reason: "Flush, 5 cards", cards: [...hand4, starter] }] };
  if (!isCrib) return { pts: 4, log: [{ pts: 4, reason: "Flush, 4 cards", cards: hand4 }] };
  return { pts: 0, log: [] };
}

/** His nobs: a jack in hand whose suit matches the cut (1 pt). @param {Card[]} hand4 @param {Card|null} starter @returns {ScoreResult} */
export function scoreNobs(hand4, starter) {
  if (!starter) return { pts: 0, log: [] };
  const j = hand4.find(c => c.rank === "J" && c.suit === starter.suit);
  return j ? { pts: 1, log: [{ pts: 1, reason: "His Nobs (J matches cut suit)", cards: [j] }] } : { pts: 0, log: [] };
}

/**
 * His heels ("his nobs is the dealer's"): the dealer pegs 2 when the cut card
 * is a jack. This is a pegging event taken at the moment of the cut, BEFORE the
 * play, and is the dealer's alone — it is NOT part of any hand or crib show
 * count. Kept separate from scoreHand for exactly that reason; callers that
 * know they are the dealer can add it at cut time.
 * @param {Card|null} starter @returns {ScoreResult}
 */
export function scoreHeels(starter) {
  return starter?.rank === "J"
    ? { pts: 2, log: [{ pts: 2, reason: "His Heels (dealer cut a Jack)", cards: [starter] }] }
    : { pts: 0, log: [] };
}

/**
 * Score a 4-card hand against a cut card — the canonical "show" count.
 * Returns fifteens + pairs + runs + flush + his-nobs. Does NOT include his
 * heels (a separate dealer-cut peg; see scoreHeels). The show count is the
 * value bounded by the cribbage impossibility theorem (never 19/25/26/27).
 * @param {Card[]} hand4 @param {Card|null} starter @param {boolean} [isCrib=false] @returns {HandScore}
 */
export function scoreHand(hand4, starter, isCrib = false) {
  const all5 = starter ? [...hand4, starter] : [...hand4];
  const parts = [scoreFifteens(all5), scorePairs(all5), scoreRuns(all5),
    scoreFlush(hand4, starter, isCrib), scoreNobs(hand4, starter)];
  return { total: parts.reduce((s, p) => s + p.pts, 0), log: parts.flatMap(p => p.log) };
}

// ─── EV Computation ─────────────────────────────────────────────────────────
//
// evHand: exact — averages over every possible cut card in the remaining deck.
//
// evCrib: deterministic stride-based sampling. For each possible cut we stride
// through opponent pairs at a fixed interval, giving ~15 samples per cut.
// With ~46 remaining cards that's 46 × 15 ≈ 690 scoreHand calls per combo.
// (An exact crib EV — averaging over all C(46,2) opponent pairs per cut — is
// ~700k score evaluations per six-card analysis and benchmarks at ~17s, so the
// deterministic sample is the right tradeoff. It is presented as an estimate.)
//
// Internal helpers take a pre-computed `rem` array so callers that evaluate
// multiple combos against the same remaining deck (analyzeHand) only pay the
// filter cost once instead of once per combo.

// Fifteens, pairs, and runs depend only on ranks, so their combined total is
// memoized by the sorted rank multiset — a small (≤6188-entry) cache with a
// very high hit rate across the thousands of cuts evaluated per analysis.
/** @type {Map<string, number>} */
const _rankTotalCache = new Map();
/** @param {Card[]} cards @returns {number} */
function fifteensPairsRunsTotal(cards) {
  const key = cards.map(c => rankIdx(c.rank)).sort((a, b) => a - b).join(",");
  const hit = _rankTotalCache.get(key);
  if (hit !== undefined) return hit;
  const v = scoreFifteens(cards).pts + scorePairs(cards).pts + scoreRuns(cards).pts;
  _rankTotalCache.set(key, v);
  return v;
}

/**
 * Total-only hand score for EV loops (no log allocation). Equivalent to
 * scoreHand(...).total but faster: the rank-driven scores are memoized and the
 * suit-driven flush / his-nobs are added directly.
 * @param {Card[]} hand4 @param {Card} starter @param {boolean} [isCrib=false]
 * @returns {number}
 */
export function scoreHandTotal(hand4, starter, isCrib = false) {
  const all5 = starter ? [...hand4, starter] : hand4;
  return fifteensPairsRunsTotal(all5)
    + scoreFlush(hand4, starter, isCrib).pts
    + scoreNobs(hand4, starter).pts;
}

/** @param {Card[]} h4 @param {readonly Card[]} rem @returns {{min:number,max:number,avg:number}} */
function _scoreAll(h4, rem) {
  if (!rem.length) return { min: 0, max: 0, avg: 0 };
  let min = Infinity, max = -Infinity, sum = 0;
  for (const c of rem) {
    const s = scoreHandTotal(h4, c, false);
    if (s < min) min = s;
    if (s > max) max = s;
    sum += s;
  }
  return { min, max, avg: sum / rem.length };
}

/** @param {Card[]} d2 @param {readonly Card[]} rem @returns {number} */
function _evCrib(d2, rem) {
  const n = rem.length;
  if (n < 3) return 0;
  const pairsPerCut = (n - 1) * (n - 2) / 2;
  const stride = Math.max(1, Math.floor(pairsPerCut / 15));
  let total = 0, count = 0;
  for (let ci = 0; ci < n; ci++) {
    let pi = 0;
    for (let oi = 0; oi < n; oi++) {
      if (oi === ci) continue;
      for (let oj = oi + 1; oj < n; oj++) {
        if (oj === ci) continue;
        if (pi % stride === 0) {
          total += scoreHandTotal([...d2, rem[oi], rem[oj]], rem[ci], true);
          count++;
        }
        pi++;
      }
    }
  }
  return count > 0 ? total / count : 0;
}

// ─── Discard analysis ────────────────────────────────────────────────────────

/**
 * @typedef {Object} DiscardOption
 * @property {Card[]} keep
 * @property {Card[]} discard
 * @property {number} handMin
 * @property {number} handMax
 * @property {number} handAvg
 * @property {number} cribAvg
 * @property {number} combinedEV
 * @property {number} rank   0–100 relative to the best option (best = 100)
 */

/**
 * Evaluate all 15 C(6,4) keeps and return them sorted by combinedEV descending.
 * combinedEV adds (dealer) or subtracts (pone) the crib EV, since the crib
 * belongs to the dealer. `onProgress(done, total)` fires after each keep so a
 * caller (e.g. a Web Worker) can surface progress.
 * @param {Card[]} h6 @param {boolean} isDealer
 * @param {(done: number, total: number) => void} [onProgress]
 * @returns {DiscardOption[]}
 */
export function analyzeHand(h6, isDealer, onProgress) {
  const exclSet = new Set(h6.map(cardKey));
  // Compute the remaining deck once — shared across all 15 combos
  const rem = FULL_DECK.filter(c => !exclSet.has(cardKey(c)));

  const keeps = combos(h6, 4);
  /** @type {DiscardOption[]} */
  const options = [];
  for (let i = 0; i < keeps.length; i++) {
    const keep = keeps[i];
    const discard = h6.filter(c => !keep.some(k => cardKey(k) === cardKey(c)));
    const { min: handMin, max: handMax, avg: handAvg } = _scoreAll(keep, rem);
    const cribAvg = _evCrib(discard, rem);
    const combinedEV = handAvg + (isDealer ? 0.5 : -0.5) * cribAvg;
    options.push({ keep, discard, handMin, handMax, handAvg, cribAvg, combinedEV, rank: 0 });
    onProgress?.(i + 1, keeps.length);
  }

  options.sort((a, b) => b.combinedEV - a.combinedEV);

  const bestEV = options[0].combinedEV;
  const worstEV = options[options.length - 1].combinedEV;
  const range = bestEV - worstEV;

  for (const opt of options) {
    opt.rank = range > 0 ? Math.round((opt.combinedEV - worstEV) / range * 100) : 100;
  }

  return options;
}
