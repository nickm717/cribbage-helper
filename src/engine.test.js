import { describe, it, expect } from "vitest";
import {
  RANKS, SUITS, cardValue, scoreHand, scorePairs, scoreRuns, scoreFlush,
  scoreNobs, scoreHeels, fullDeck, cardKey, combos, shuffle,
} from "./engine.js";

// Terse card constructor for readable canonical hands.
const C = (rank, suit) => ({ rank, suit });

describe("cardValue", () => {
  it("aces are 1, faces are 10, pips are face value", () => {
    expect(cardValue("A")).toBe(1);
    expect(cardValue("5")).toBe(5);
    expect(cardValue("10")).toBe(10);
    expect(cardValue("J")).toBe(10);
    expect(cardValue("Q")).toBe(10);
    expect(cardValue("K")).toBe(10);
  });
});

describe("canonical hands", () => {
  it("perfect 29: 5♥ 5♠ 5♣ J♦ with cut 5♦", () => {
    // Four 5s = 8 fifteens(J+5 x4) + 8 fifteens(5+5+5 x4) = 16, six pairs = 12,
    // and the J♦ matches the ♦ cut for one nobs. 16 + 12 + 1 = 29.
    const r = scoreHand([C("5","♥"), C("5","♠"), C("5","♣"), C("J","♦")], C("5","♦"), false);
    expect(r.total).toBe(29);
  });

  it("28: four 5s plus a ten-value cut that grants no nobs", () => {
    // Same fifteens (16) and pairs (12) as the 29 hand, but a King cut is a
    // ten-value card that is not a jack, so there is no nobs. 16 + 12 = 28.
    const r = scoreHand([C("5","♥"), C("5","♠"), C("5","♣"), C("5","♦")], C("K","♠"), false);
    expect(r.total).toBe(28);
  });

  it("the lowest hands score zero", () => {
    const r = scoreHand([C("A","♠"), C("3","♥"), C("7","♦"), C("9","♣")], C("K","♠"), false);
    expect(r.total).toBe(0);
  });
});

describe("fifteens", () => {
  it("counts every distinct 15-summing subset", () => {
    // 5,10,5 -> 5+10 and 5+10 = two fifteens; plus nothing else. 4 pts.
    const r = scoreHand([C("5","♠"), C("10","♥"), C("5","♦"), C("2","♣")], C("8","♠"), false);
    // 5+10=15 (two 5s) -> 4; 5+2+8=15 (two 5s) -> 4; 5+5+... =10 no. pair of 5s -> 2.
    expect(r.total).toBe(10);
  });
});

describe("pairs and sets", () => {
  it("two distinct pairs are two rows, not 'four of a kind'", () => {
    const { pts, log } = scorePairs([C("5","♠"), C("5","♥"), C("6","♦"), C("6","♣")]);
    expect(pts).toBe(4);
    expect(log).toHaveLength(2);
    expect(log.every(l => l.reason === "Pair")).toBe(true);
  });

  it("three of a kind is one row worth 6", () => {
    const { pts, log } = scorePairs([C("7","♠"), C("7","♥"), C("7","♦"), C("2","♣")]);
    expect(pts).toBe(6);
    expect(log).toHaveLength(1);
    expect(log[0].reason).toBe("Three of a Kind");
  });

  it("trips plus a pair are two correctly labeled rows", () => {
    const { pts, log } = scorePairs([C("5","♠"), C("5","♥"), C("5","♦"), C("6","♣"), C("6","♠")]);
    expect(pts).toBe(8);
    expect(log.map(l => l.reason).sort()).toEqual(["Pair", "Three of a Kind"]);
  });

  it("four of a kind is one row worth 12", () => {
    const { pts, log } = scorePairs([C("8","♠"), C("8","♥"), C("8","♦"), C("8","♣")]);
    expect(pts).toBe(12);
    expect(log).toHaveLength(1);
    expect(log[0].reason).toBe("Four of a Kind");
  });
});

describe("runs", () => {
  it("scores a single run of three", () => {
    const { pts, log } = scoreRuns([C("4","♠"), C("5","♥"), C("6","♦"), C("9","♣")]);
    expect(pts).toBe(3);
    expect(log).toHaveLength(1);
    expect(log[0].reason).toBe("Run of 3");
  });

  it("double run of three: a pair inside a run yields two runs", () => {
    const { pts, log } = scoreRuns([C("4","♠"), C("5","♥"), C("6","♦"), C("6","♣")]);
    expect(pts).toBe(6); // two runs of 3
    expect(log).toHaveLength(2);
    expect(log.every(l => l.reason === "Run of 3")).toBe(true);
  });

  it("double run of four counts both four-card runs", () => {
    const { pts } = scoreRuns([C("4","♠"), C("5","♥"), C("5","♦"), C("6","♣"), C("7","♠")]);
    expect(pts).toBe(8); // two runs of 4
  });

  it("a run of five is counted once, not as sub-runs", () => {
    const { pts, log } = scoreRuns([C("3","♠"), C("4","♥"), C("5","♦"), C("6","♣"), C("7","♠")]);
    expect(pts).toBe(5);
    expect(log).toHaveLength(1);
  });

  it("aces are low only: Q-K-A does not wrap", () => {
    const { pts } = scoreRuns([C("Q","♠"), C("K","♥"), C("A","♦")]);
    expect(pts).toBe(0);
  });
});

describe("flush", () => {
  const fourHearts = [C("2","♥"), C("6","♥"), C("9","♥"), C("J","♥")];

  it("4-card hand flush scores 4 when the cut is a different suit", () => {
    expect(scoreFlush(fourHearts, C("5","♠"), false).pts).toBe(4);
  });

  it("5-card flush scores 5 when the cut matches", () => {
    expect(scoreFlush(fourHearts, C("5","♥"), false).pts).toBe(5);
  });

  it("crib needs all five suited: 4-card crib flush scores 0", () => {
    expect(scoreFlush(fourHearts, C("5","♠"), true).pts).toBe(0);
  });

  it("crib 5-card flush scores 5", () => {
    expect(scoreFlush(fourHearts, C("5","♥"), true).pts).toBe(5);
  });

  it("no flush when hand suits are mixed", () => {
    expect(scoreFlush([C("2","♥"), C("6","♠"), C("9","♥"), C("J","♥")], C("5","♥"), false).pts).toBe(0);
  });

  it("requires the full four-card hand (precondition guard)", () => {
    expect(scoreFlush([C("2","♥"), C("6","♥"), C("9","♥")], C("5","♥"), false).pts).toBe(0);
  });
});

describe("his nobs vs his heels", () => {
  it("his nobs: a jack in hand matching the cut suit scores 1", () => {
    expect(scoreNobs([C("J","♥"), C("2","♠"), C("4","♦"), C("8","♣")], C("9","♥")).pts).toBe(1);
  });

  it("no nobs when the in-hand jack's suit differs from the cut", () => {
    expect(scoreNobs([C("J","♠"), C("2","♠"), C("4","♦"), C("8","♣")], C("9","♥")).pts).toBe(0);
  });

  it("his heels is a separate dealer-cut peg of 2 for a jack cut", () => {
    expect(scoreHeels(C("J","♣")).pts).toBe(2);
    expect(scoreHeels(C("9","♣")).pts).toBe(0);
  });

  it("scoreHand never folds his heels into the show count", () => {
    // A jack cut with no other scoring must total 0 in the show.
    const r = scoreHand([C("2","♠"), C("4","♥"), C("6","♦"), C("8","♣")], C("J","♥"), false);
    expect(r.total).toBe(0);
    expect(r.log.some(l => /heel/i.test(l.reason))).toBe(false);
  });
});

describe("impossibility guards", () => {
  // The cribbage show count can never be 19, 25, 26, or 27. We assert this two
  // ways: an exhaustive sweep over every distinct rank pattern, and a broad
  // deterministic sample that also exercises suit-dependent scoring (flush /
  // nobs). Together they guard the invariant on the real engine.
  const FORBIDDEN = new Set([19, 25, 26, 27]);

  it("exhaustive over rank patterns (suit-neutral) never yields 19/25/26/27", () => {
    // Assign suits so no flush and no nobs can occur, isolating the
    // rank-driven scores (fifteens, pairs, runs) across every 4-rank hand +
    // every cut rank. 13^4 * 13 patterns, deduped by value.
    const seen = new Set();
    const suits = ["♠", "♥", "♦", "♣"];
    for (let a = 0; a < 13; a++)
    for (let b = a; b < 13; b++)
    for (let c = b; c < 13; c++)
    for (let d = c; d < 13; d++)
    for (let e = 0; e < 13; e++) {
      // Spread suits so four-of-a-kind stays legal but flush/nobs never trigger:
      // give the hand mixed suits and the cut a suit no jack in hand matches.
      const hand = [C(RANKS[a], suits[0]), C(RANKS[b], suits[1]),
                    C(RANKS[c], suits[2]), C(RANKS[d], suits[3])];
      const cut = C(RANKS[e], suits[0]); // a spade cut; hand spade is index 0
      const total = scoreHand(hand, cut, false).total;
      seen.add(total);
    }
    for (const f of FORBIDDEN) expect(seen.has(f)).toBe(false);
    // Sanity: the sweep did reach real scores including the maximum, 28+nobs
    // can't appear here (no nobs), but 28 (four 5s + ten) should.
    expect(seen.has(28)).toBe(true);
  });

  it("deterministic sample of real deals (with suits) never yields 19/25/26/27", () => {
    const deck = fullDeck();
    let rng = 2463534242 >>> 0;
    const nextIdx = () => {
      // xorshift32 — deterministic, fast, good enough for sampling.
      rng ^= rng << 13; rng >>>= 0;
      rng ^= rng >> 17;
      rng ^= rng << 5; rng >>>= 0;
      return rng % 52;
    };
    for (let i = 0; i < 50000; i++) {
      const idx = new Set();
      while (idx.size < 5) idx.add(nextIdx());
      const cards = [...idx].map(k => deck[k]);
      const total = scoreHand(cards.slice(0, 4), cards[4], false).total;
      expect(FORBIDDEN.has(total)).toBe(false);
    }
  }, 20000);
});

describe("deck and combos", () => {
  it("the deck is 52 unique cards", () => {
    const deck = fullDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardKey)).size).toBe(52);
    expect(SUITS).toHaveLength(4);
    expect(RANKS).toHaveLength(13);
  });

  it("combos(6,4) yields the 15 discard keeps", () => {
    expect(combos([1, 2, 3, 4, 5, 6], 4)).toHaveLength(15);
  });

  it("shuffle returns a permutation without mutating the input", () => {
    const deck = fullDeck();
    const s = shuffle(deck);
    expect(s).toHaveLength(52);
    expect(new Set(s.map(cardKey))).toEqual(new Set(deck.map(cardKey)));
    expect(deck.map(cardKey)).toEqual(fullDeck().map(cardKey)); // input untouched
  });
});
