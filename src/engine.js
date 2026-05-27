// ─── Shared game logic ──────────────────────────────────────────────────────

export const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
export const SUITS = ["♠","♥","♦","♣"];

export function cardValue(r) {
  if (r === "A") return 1;
  if (["J","Q","K"].includes(r)) return 10;
  return parseInt(r);
}
export function rankIdx(r) { return RANKS.indexOf(r); }
export function isRed(s) { return s === "♥" || s === "♦"; }
export function cardKey(c) { return c.rank + c.suit; }
export function fullDeck() { return SUITS.flatMap(s => RANKS.map(r => ({ rank: r, suit: s }))); }

export function combos(arr, size) {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const [first, ...rest] = arr;
  return [...combos(rest, size - 1).map(c => [first, ...c]), ...combos(rest, size)];
}

export function scoreFifteens(cards) {
  let pts = 0, log = [];
  for (let sz = 2; sz <= 5; sz++)
    combos(cards, sz).forEach(combo => {
      if (combo.reduce((s, c) => s + cardValue(c.rank), 0) === 15)
        { pts += 2; log.push({ pts: 2, reason: "Fifteen", cards: combo }); }
    });
  return { pts, log };
}

export function scorePairs(cards) {
  let pts = 0, raw = [];
  combos(cards, 2).forEach(([a, b]) => { if (a.rank === b.rank) { pts += 2; raw.push([a, b]); } });
  if (!pts) return { pts: 0, log: [] };
  const uniq = raw.flatMap(p => p).filter((c, i, a) => a.findIndex(x => cardKey(x) === cardKey(c)) === i);
  const n = pts / 2;
  const reason = n === 1 ? "Pair" : n === 3 ? "Pair Royal (3 of a kind)" : "Double Pair Royal (4 of a kind)";
  return { pts, log: [{ pts, reason, cards: uniq }] };
}

export function scoreRuns(cards) {
  let pts = 0, log = [];
  for (let sz = 5; sz >= 3; sz--) {
    const runs = [];
    combos(cards, sz).forEach(combo => {
      const idxs = combo.map(c => rankIdx(c.rank)).sort((a, b) => a - b);
      if (idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1)) runs.push(combo);
    });
    if (runs.length) { runs.forEach(r => { pts += sz; log.push({ pts: sz, reason: `Run of ${sz}`, cards: r }); }); break; }
  }
  return { pts, log };
}

export function scoreFlush(hand4, starter, isCrib) {
  const s = hand4[0]?.suit;
  if (!s || !hand4.every(c => c.suit === s)) return { pts: 0, log: [] };
  if (starter?.suit === s) return { pts: 5, log: [{ pts: 5, reason: "Flush, 5 cards", cards: [...hand4, starter] }] };
  if (!isCrib) return { pts: 4, log: [{ pts: 4, reason: "Flush, 4 cards", cards: hand4 }] };
  return { pts: 0, log: [] };
}

export function scoreNobs(hand4, starter) {
  if (!starter) return { pts: 0, log: [] };
  const j = hand4.find(c => c.rank === "J" && c.suit === starter.suit);
  return j ? { pts: 1, log: [{ pts: 1, reason: "His Nobs (J matches cut suit)", cards: [j] }] } : { pts: 0, log: [] };
}

export function scoreNibs(starter) {
  return starter?.rank === "J"
    ? { pts: 2, log: [{ pts: 2, reason: "His Nibs (cut card is a Jack)", cards: [starter] }] }
    : { pts: 0, log: [] };
}

export function scoreHand(hand4, starter, isCrib) {
  const all5 = starter ? [...hand4, starter] : [...hand4];
  const parts = [scoreFifteens(all5), scorePairs(all5), scoreRuns(all5),
    scoreFlush(hand4, starter, isCrib), scoreNobs(hand4, starter), scoreNibs(starter)];
  return { total: parts.reduce((s, p) => s + p.pts, 0), log: parts.flatMap(p => p.log) };
}

// ─── EV Computation ─────────────────────────────────────────────────────────
//
// evHand: exact — averages over every possible cut card in the remaining deck.
//
// evCrib: deterministic stride-based sampling. For each possible cut we stride
// through opponent pairs at a fixed interval, giving ~15 samples per cut.
// With ~46 remaining cards that's 46 × 15 ≈ 690 scoreHand calls per combo.

export function evHand(h4, exclSet) {
  const rem = fullDeck().filter(c => !exclSet.has(cardKey(c)));
  if (!rem.length) return 0;
  return rem.reduce((s, c) => s + scoreHand(h4, c, false).total, 0) / rem.length;
}

export function evCrib(d2, exclSet) {
  const rem = fullDeck().filter(c => !exclSet.has(cardKey(c)));
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
          total += scoreHand([...d2, rem[oi], rem[oj]], rem[ci], true).total;
          count++;
        }
        pi++;
      }
    }
  }
  return count > 0 ? total / count : 0;
}

export function bestKeep(h6, isDealer) {
  const exclSet = new Set(h6.map(cardKey));
  let best = null, bestEV = -Infinity;
  for (const keep of combos(h6, 4)) {
    const discard = h6.filter(c => !keep.some(k => cardKey(k) === cardKey(c)));
    const hEV = evHand(keep, exclSet);
    const cEV = evCrib(discard, exclSet);
    const ev = hEV + (isDealer ? 0.5 : -0.5) * cEV;
    if (ev > bestEV) { bestEV = ev; best = { keep, discard, hEV, cEV, ev }; }
  }
  return best;
}

// ─── Discard analysis ────────────────────────────────────────────────────────

// Returns { min, max, avg } scoring h4 against every possible cut in the deck.
export function handStats(h4, exclSet) {
  const rem = fullDeck().filter(c => !exclSet.has(cardKey(c)));
  if (!rem.length) return { min: 0, max: 0, avg: 0 };
  let min = Infinity, max = -Infinity, sum = 0;
  for (const c of rem) {
    const s = scoreHand(h4, c, false).total;
    if (s < min) min = s;
    if (s > max) max = s;
    sum += s;
  }
  return { min, max, avg: sum / rem.length };
}

// Evaluates all 15 C(6,4) keeps and returns them sorted by combinedEV descending.
// Each entry: { keep, discard, handMin, handMax, handAvg, cribAvg, combinedEV, rank }
// rank is 0–100 relative to the best option (best = 100).
export function analyzeHand(h6, isDealer) {
  const exclSet = new Set(h6.map(cardKey));
  const options = combos(h6, 4).map(keep => {
    const discard = h6.filter(c => !keep.some(k => cardKey(k) === cardKey(c)));
    const { min: handMin, max: handMax, avg: handAvg } = handStats(keep, exclSet);
    const cribAvg = evCrib(discard, exclSet);
    const combinedEV = handAvg + (isDealer ? 0.5 : -0.5) * cribAvg;
    return { keep, discard, handMin, handMax, handAvg, cribAvg, combinedEV, rank: 0 };
  });

  options.sort((a, b) => b.combinedEV - a.combinedEV);

  const bestEV = options[0].combinedEV;
  const worstEV = options[options.length - 1].combinedEV;
  const range = bestEV - worstEV;

  for (const opt of options) {
    opt.rank = range > 0 ? Math.round((opt.combinedEV - worstEV) / range * 100) : 100;
  }

  return options;
}
