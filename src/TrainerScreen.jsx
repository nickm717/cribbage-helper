import { useState, useEffect } from "react";

// ─── Shared game logic ──────────────────────────────────────────────────────

const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const SUITS = ["♠","♥","♦","♣"];

function cardValue(r) {
  if (r === "A") return 1;
  if (["J","Q","K"].includes(r)) return 10;
  return parseInt(r);
}
function rankIdx(r) { return RANKS.indexOf(r); }
function isRed(s) { return s === "♥" || s === "♦"; }
function cardKey(c) { return c.rank + c.suit; }
function fullDeck() { return SUITS.flatMap(s => RANKS.map(r => ({ rank: r, suit: s }))); }

function combos(arr, size) {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const [first, ...rest] = arr;
  return [...combos(rest, size - 1).map(c => [first, ...c]), ...combos(rest, size)];
}

function scoreFifteens(cards) {
  let pts = 0, log = [];
  for (let sz = 2; sz <= 5; sz++)
    combos(cards, sz).forEach(combo => {
      if (combo.reduce((s, c) => s + cardValue(c.rank), 0) === 15)
        { pts += 2; log.push({ pts: 2, reason: "Fifteen", cards: combo }); }
    });
  return { pts, log };
}
function scorePairs(cards) {
  let pts = 0, raw = [];
  combos(cards, 2).forEach(([a, b]) => { if (a.rank === b.rank) { pts += 2; raw.push([a, b]); } });
  if (!pts) return { pts: 0, log: [] };
  const uniq = raw.flatMap(p => p).filter((c, i, a) => a.findIndex(x => cardKey(x) === cardKey(c)) === i);
  const n = pts / 2;
  const reason = n === 1 ? "Pair" : n === 3 ? "Pair Royal (3 of a kind)" : "Double Pair Royal (4 of a kind)";
  return { pts, log: [{ pts, reason, cards: uniq }] };
}
function scoreRuns(cards) {
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
function scoreFlush(hand4, starter, isCrib) {
  const s = hand4[0]?.suit;
  if (!s || !hand4.every(c => c.suit === s)) return { pts: 0, log: [] };
  if (starter?.suit === s) return { pts: 5, log: [{ pts: 5, reason: "Flush, 5 cards", cards: [...hand4, starter] }] };
  if (!isCrib) return { pts: 4, log: [{ pts: 4, reason: "Flush, 4 cards", cards: hand4 }] };
  return { pts: 0, log: [] };
}
function scoreNobs(hand4, starter) {
  if (!starter) return { pts: 0, log: [] };
  const j = hand4.find(c => c.rank === "J" && c.suit === starter.suit);
  return j ? { pts: 1, log: [{ pts: 1, reason: "His Nobs (J matches cut suit)", cards: [j] }] } : { pts: 0, log: [] };
}
function scoreNibs(starter) {
  return starter?.rank === "J"
    ? { pts: 2, log: [{ pts: 2, reason: "His Nibs (cut card is a Jack)", cards: [starter] }] }
    : { pts: 0, log: [] };
}
function scoreHand(hand4, starter, isCrib) {
  const all5 = starter ? [...hand4, starter] : [...hand4];
  const parts = [scoreFifteens(all5), scorePairs(all5), scoreRuns(all5),
    scoreFlush(hand4, starter, isCrib), scoreNobs(hand4, starter), scoreNibs(starter)];
  return { total: parts.reduce((s, p) => s + p.pts, 0), log: parts.flatMap(p => p.log) };
}

// ─── EV Computation ─────────────────────────────────────────────────────────
//
// Both functions are fully deterministic: same cards in → same EV out, every time.
//
// evHand: exact — averages over every possible cut card in the remaining deck.
//
// evCrib: deterministic stride-based sampling. The remaining deck is always in
// the same order (fullDeck() is fixed). For each possible cut we stride through
// opponent pairs at a fixed interval, giving ~15 samples per cut. With ~46 remaining
// cards that's 46 × 15 ≈ 690 scoreHand calls per combo — fast and consistent.

function evHand(h4, exclSet) {
  // Exact: score against every remaining card as the cut, then average.
  const rem = fullDeck().filter(c => !exclSet.has(cardKey(c)));
  if (!rem.length) return 0;
  return rem.reduce((s, c) => s + scoreHand(h4, c, false).total, 0) / rem.length;
}

function evCrib(d2, exclSet) {
  // Deterministic: for each cut card, stride through opponent pairs at a fixed
  // interval derived from deck size — no randomness, same result every call.
  const rem = fullDeck().filter(c => !exclSet.has(cardKey(c)));
  const n = rem.length;
  if (n < 3) return 0;
  const pairsPerCut = (n - 1) * (n - 2) / 2; // C(n-1, 2)
  const stride = Math.max(1, Math.floor(pairsPerCut / 15)); // ~15 samples per cut
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

function bestKeep(h6, isDealer) {
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

// ─── Card Components ─────────────────────────────────────────────────────────

// PlayingCard: visual card only — no click/lift logic (CardFan handles that)
function PlayingCard({ card, selected, dimmed, t }) {
  const red = card && isRed(card.suit);
  return (
    <div style={{
      width: 54, height: 78, borderRadius: 7, flexShrink: 0,
      background: "#f5f0e8",
      border: `2px solid ${selected ? t.accentYellow : "rgba(0,0,0,0.15)"}`,
      boxShadow: selected
        ? `0 8px 20px rgba(0,0,0,0.55), 0 0 0 2px ${t.accentYellow}`
        : "0 3px 8px rgba(0,0,0,0.45)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: dimmed ? 0.35 : 1,
      transition: "opacity 0.15s, border-color 0.15s, box-shadow 0.15s",
      userSelect: "none", WebkitUserSelect: "none",
      position: "relative",
    }}>
      {/* Top-left corner */}
      <div style={{ position: "absolute", top: 3, left: 4, lineHeight: 1.1, textAlign: "center" }}>
        <div style={{ fontSize: card?.rank === "10" ? 12 : 14, fontWeight: 900, color: red ? "#b91c1c" : "#1c1c1e", fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em", lineHeight: 1 }}>{card?.rank}</div>
        <div style={{ fontSize: 10, color: red ? "#b91c1c" : "#1c1c1e", lineHeight: 1.2 }}>{card?.suit}</div>
      </div>
      {/* Center suit */}
      <span style={{ fontSize: 24, color: red ? "#b91c1c" : "#1c1c1e", lineHeight: 1 }}>{card?.suit}</span>
      {/* Bottom-right corner (rotated) */}
      <div style={{ position: "absolute", bottom: 3, right: 4, lineHeight: 1.1, textAlign: "center", transform: "rotate(180deg)" }}>
        <div style={{ fontSize: card?.rank === "10" ? 12 : 14, fontWeight: 900, color: red ? "#b91c1c" : "#1c1c1e", fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em", lineHeight: 1 }}>{card?.rank}</div>
        <div style={{ fontSize: 10, color: red ? "#b91c1c" : "#1c1c1e", lineHeight: 1.2 }}>{card?.suit}</div>
      </div>
    </div>
  );
}

// CardFan: flat row of cards with tap-to-select. Selected cards slide up in
// place — no overlap means no stacking conflicts. Sized to fit 6 cards on
// mobile (~375px): 6 × 56 + 5 × 4 = 356px.
function CardFan({ cards, selected = [], onSelect, dimOthers = false, t }) {
  const LIFT = 18;
  return (
    <div style={{
      display: "flex", gap: 4, justifyContent: "center",
      paddingTop: LIFT, // reserve room so lifted cards don't clip
    }}>
      {cards.map((card, i) => {
        const isSel = selected.includes(i);
        const isDim = dimOthers && !isSel;
        return (
          <div
            key={cardKey(card)}
            onClick={() => onSelect?.(i)}
            style={{
              transform: isSel ? `translateY(-${LIFT}px)` : "translateY(0)",
              transition: "transform 0.15s ease",
              cursor: onSelect ? "pointer" : "default",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <PlayingCard card={card} selected={isSel} dimmed={isDim} t={t} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Small reusable components ───────────────────────────────────────────────

function MiniCard({ card, t }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 11, fontWeight: 800,
      color: isRed(card.suit) ? t.redCard : t.blueCard,
      background: t.surfaceRaised, borderRadius: 4, padding: "2px 5px",
      fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em",
    }}>{card.rank}{card.suit}</span>
  );
}

function StatChip({ label, value, t }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  );
}

// SessionStatStrip: efficiency is the entire point of the Trainer, so it owns
// the strip. Hands and points are demoted to a single secondary metadata line.
// Tier color follows the score-tier palette (the only multi-color exception in
// the system, per DESIGN.md). Compact vertical footprint: the strip aligns
// label + metadata to the big number's baseline so the whole row is one line tall.
function SessionStatStrip({ hands, yourPts, optPts, efficiency, t }) {
  const hasData = hands > 0;
  const tier = !hasData ? null
    : efficiency >= 90 ? t.scoreAccents[3]  // green
    : efficiency >= 75 ? t.scoreAccents[2]  // orange
    : efficiency >= 60 ? t.scoreAccents[1]  // red
    : t.scoreAccents[0];                    // purple
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, width: "100%",
    }}>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: t.textMuted,
          letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1,
        }}>
          Session Efficiency
        </div>
        <div style={{
          fontSize: 12, color: t.textSecondary, lineHeight: 1.1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {hasData
            ? <>{hands} hand{hands === 1 ? "" : "s"} <span style={{ color: t.textMuted }}>·</span> {yourPts}/{optPts} pts</>
            : <>Play a hand to start tracking</>}
        </div>
      </div>
      <div style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 30, fontWeight: 800, lineHeight: 1,
        color: hasData ? tier : t.textMuted,
        letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums",
        flexShrink: 0,
      }}>
        {hasData ? `${efficiency}%` : "—"}
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, disabled, t }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
      background: disabled ? t.surfaceRaised : t.accentYellow,
      color: disabled ? t.textDisabled : "#1c1c1e",
      fontSize: 15, fontWeight: 700, cursor: disabled ? "default" : "pointer",
      transition: "background 0.15s", WebkitTapHighlightColor: "transparent",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>{label}</button>
  );
}

function SectionBlock({ title, children, t, accent }) {
  return (
    <div style={{
      background: t.surfaceBg, borderRadius: 10, padding: "12px 14px",
      border: `1px solid ${accent || t.border}`,
    }}>
      {title && <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>}
      {children}
    </div>
  );
}

function EVCell({ label, value, t }) {
  return (
    <div style={{ background: t.surfaceSunken, borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  );
}

function ScoreLogRow({ item, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
      <span style={{
        minWidth: 32, height: 28, borderRadius: 6,
        background: t.surfaceRaised, color: t.textPrimary,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 12, flexShrink: 0,
      }}>+{item.pts}</span>
      <span style={{ fontSize: 13, color: t.textPrimary, flex: 1 }}>{item.reason}</span>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {[...new Map(item.cards.map(c => [cardKey(c), c])).values()].map(c => (
          <MiniCard key={cardKey(c)} card={c} t={t} />
        ))}
      </div>
    </div>
  );
}

function PhaseStrip({ phase, t }) {
  const phases = ["discard", "score"];
  const cur = phases.indexOf(phase);
  return (
    <div style={{ display: "flex", gap: 3, padding: "8px 16px 0" }}>
      {phases.map((p, i) => (
        <div key={p} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i < cur ? t.accentYellow + "80" : i === cur ? t.accentYellow : t.surfaceRaised,
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

// ─── Body sections ───────────────────────────────────────────────────────────

// CribDestination: the headline of the discard phase. Names whose crib gets
// the cards in plain language (no "dealer" / "pone" jargon) and adds one
// strategic hint so a newer player learns the implication. Progress through
// the selection ("Select 2 more cards" → "Discard →") is shown by the dock
// button, not here, so One Voice (gold) stays uncontested in this region.
function CribDestination({ isDealer, t }) {
  const owner = isDealer ? "Your crib" : "Opponent's crib";
  const implication = isDealer
    ? "These two cards score for you"
    : "These two cards score for them";
  return (
    <div style={{
      textAlign: "center",
      paddingTop: 28,
      paddingBottom: 8,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: t.textMuted,
        letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1,
      }}>
        Discarding to
      </div>
      <div style={{
        fontSize: 26, fontWeight: 800, color: t.textPrimary,
        letterSpacing: "-0.01em", lineHeight: 1.1,
      }}>
        {owner}
      </div>
      <div style={{
        fontSize: 13, color: t.textSecondary, lineHeight: 1.3,
        marginTop: 2, maxWidth: 280,
      }}>
        {implication}
      </div>
    </div>
  );
}

function DiscardBody({ isDealer, t }) {
  return <CribDestination isDealer={isDealer} t={t} />;
}

function ScoreBody({ feedback, kept, cut, handResult, cribResult, optHandResult, optResult, isDealer, session, t }) {
  const gradeColor = !feedback ? t.accentYellow
    : feedback.grade === "Optimal" ? "#34d399"
    : feedback.grade === "Close" ? "#fb923c" : "#f87171";

  // Session totals including this hand (for live display before session state is committed)
  const thisYour = (handResult?.total || 0) + (isDealer && cribResult ? cribResult.total : 0);
  const thisOpt = (optHandResult?.total || 0) + (isDealer && cribResult ? cribResult.total : 0);
  const totalYour = session.yourPts + thisYour;
  const totalOpt = session.optPts + thisOpt;
  const hands = session.hands + 1;
  const eff = totalOpt > 0 ? Math.round(totalYour / totalOpt * 100) : 100;
  const effColor = eff >= 90 ? "#34d399" : eff >= 75 ? "#fb923c" : "#f87171";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Discard grade */}
      {feedback && (
        <SectionBlock t={t} accent={gradeColor}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: feedback.grade !== "Optimal" ? 8 : 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: gradeColor }}>
              {feedback.grade === "Optimal" ? "✓ Optimal discard" : feedback.grade === "Close" ? "≈ Close discard" : "✗ Suboptimal discard"}
            </span>
            <span style={{ fontSize: 13, color: t.textSecondary, fontWeight: 600 }}>
              {feedback.evDiff >= 0 ? "+" : ""}{feedback.evDiff.toFixed(2)} EV
            </span>
          </div>
          {feedback.grade !== "Optimal" && (
            <div style={{ fontSize: 12, color: t.textSecondary }}>
              Optimal keep:{" "}
              {feedback.optKeep.map(c => (
                <span key={cardKey(c)} style={{ color: isRed(c.suit) ? t.redCard : t.blueCard, fontWeight: 700, marginRight: 4, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em" }}>
                  {c.rank}{c.suit}
                </span>
              ))}
            </div>
          )}
        </SectionBlock>
      )}

      {/* Hand score */}
      {handResult && (
        <SectionBlock title="Your Hand" t={t}>
          {/* Cards */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            {kept.map(c => <MiniCard key={cardKey(c)} card={c} t={t} />)}
            {cut && <>
              <span style={{ color: t.textMuted, fontSize: 13 }}>+</span>
              <MiniCard card={cut} t={t} />
              <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 2 }}>cut</span>
            </>}
          </div>
          {/* Score total */}
          <div style={{ fontSize: 40, fontWeight: 900, color: t.accentYellow, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em", lineHeight: 1, marginBottom: 10 }}>
            {handResult.total} pts
          </div>
          {/* Breakdown */}
          {handResult.log.map((item, i) => <ScoreLogRow key={i} item={item} t={t} />)}
          {!handResult.log.length && <div style={{ fontSize: 13, color: t.textSecondary }}>No scoring combinations</div>}
          {/* Optimal comparison */}
          {optResult && optHandResult && optHandResult.total !== handResult.total && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}`, fontSize: 13, color: t.textSecondary }}>
              Optimal keep would have scored{" "}
              <span style={{ color: "#fb923c", fontWeight: 700, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em" }}>{optHandResult.total} pts</span>
            </div>
          )}
        </SectionBlock>
      )}

      {/* Crib score (dealer only) */}
      {isDealer && cribResult && (
        <SectionBlock title="Your Crib" t={t}>
          <div style={{ fontSize: 32, fontWeight: 900, color: t.textPrimary, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em", lineHeight: 1, marginBottom: 10 }}>
            {cribResult.total} pts
          </div>
          {cribResult.log.map((item, i) => <ScoreLogRow key={i} item={item} t={t} />)}
          {!cribResult.log.length && <div style={{ fontSize: 13, color: t.textSecondary }}>No scoring combinations</div>}
        </SectionBlock>
      )}

      {/* Session */}
      <SectionBlock title="Session" t={t}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
          <StatChip label="Hands" value={hands} t={t} />
          <StatChip label="Your Pts" value={totalYour} t={t} />
          <StatChip label="Opt Pts" value={totalOpt} t={t} />
        </div>
        <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          Efficiency
        </div>
        <div style={{ background: t.surfaceRaised, borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 6 }}>
          <div style={{
            height: "100%", width: `${Math.min(100, eff)}%`,
            background: "linear-gradient(to right,#f87171,#fb923c,#f5b800,#34d399)",
            borderRadius: 6, transition: "width 0.6s ease-out",
          }} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: effColor, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.01em" }}>{eff}%</div>
      </SectionBlock>

    </div>
  );
}

// ─── Main TrainerScreen ──────────────────────────────────────────────────────

export default function TrainerScreen({ t }) {
  const [session, setSession] = useState({ hands: 0, yourPts: 0, optPts: 0 });
  const [phase, setPhase] = useState("discard");
  const [isDealer, setIsDealer] = useState(true);
  const [hand6, setHand6] = useState([]);
  const [selected, setSelected] = useState([]);
  const [kept, setKept] = useState([]);
  const [discarded, setDiscarded] = useState([]);
  const [cut, setCut] = useState(null);
  const [optResult, setOptResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [handResult, setHandResult] = useState(null);
  const [cribResult, setCribResult] = useState(null);
  const [optHandResult, setOptHandResult] = useState(null);

  function dealNewHand() {
    const deck = [...fullDeck()].sort(() => Math.random() - 0.5);
    const newHand6 = deck.slice(0, 6).sort((a, b) => rankIdx(a.rank) - rankIdx(b.rank));
    setHand6(newHand6);
    setIsDealer(Math.random() > 0.5);
    setSelected([]); setKept([]); setDiscarded([]); setCut(null);
    setFeedback(null); setOptResult(null);
    setHandResult(null); setCribResult(null); setOptHandResult(null);
    setPhase("discard");
  }

  // Initial deal
  useEffect(() => { dealNewHand(); }, []); // eslint-disable-line

  function toggleSelect(idx) {
    setSelected(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : prev.length >= 2 ? prev : [...prev, idx]
    );
  }

  function confirmDiscard() {
    if (selected.length !== 2) return;
    const keptCards = hand6.filter((_, i) => !selected.includes(i));
    const discardedCards = hand6.filter((_, i) => selected.includes(i));

    // ── EV analysis (deterministic — same hand always gives same result) ──
    const exclSet = new Set(hand6.map(cardKey));
    const playerHandEV = evHand(keptCards, exclSet);
    const playerCribEV = evCrib(discardedCards, exclSet);
    const playerEV = playerHandEV + (isDealer ? 0.5 : -0.5) * playerCribEV;
    const opt = bestKeep(hand6, isDealer);
    const evDiff = playerEV - opt.ev;
    // "Optimal" = you found the single best keep (within rounding of the approximation).
    // "Close" = within 1.5 EV points. "Suboptimal" = further off.
    const grade = evDiff >= -0.5 ? "Optimal" : evDiff >= -1.5 ? "Close" : "Suboptimal";
    const fb = { playerEV, playerHandEV, playerCribEV, optEV: opt.ev, grade, evDiff, optKeep: opt.keep };

    // ── Draw cut card ──────────────────────────────────────────────────────
    const remaining = fullDeck().filter(c => !exclSet.has(cardKey(c)));
    const cutCard = remaining[Math.floor(Math.random() * remaining.length)];

    // ── Score hand ─────────────────────────────────────────────────────────
    const hResult = scoreHand(keptCards, cutCard, false);

    // ── Score crib (dealer only — simulate 2 random opponent discards) ─────
    let cResult = null;
    if (isDealer) {
      const rem2 = remaining.filter(c => cardKey(c) !== cardKey(cutCard));
      // Opponent discards: pick two cards spaced across the remaining deck
      // (deterministic-ish, but the cut itself is still random so this is fine)
      const stride = Math.floor(rem2.length / 3);
      const oDiscard = [rem2[stride], rem2[stride * 2]];
      cResult = scoreHand([...discardedCards, ...oDiscard], cutCard, true);
    }

    // ── Score what the optimal keep would have gotten with this cut ────────
    const optH = scoreHand(opt.keep, cutCard, false);

    setFeedback(fb);
    setOptResult(opt);
    setKept(keptCards);
    setDiscarded(discardedCards);
    setCut(cutCard);
    setHandResult(hResult);
    setCribResult(cResult);
    setOptHandResult(optH);
    setPhase("score");
  }

  function handleDealNewHand() {
    // Commit this hand to session before resetting
    if (phase === "score" && handResult) {
      const yourPts = handResult.total + (isDealer && cribResult ? cribResult.total : 0);
      const optPts = (optHandResult?.total || 0) + (isDealer && cribResult ? cribResult.total : 0);
      setSession(s => ({ hands: s.hands + 1, yourPts: s.yourPts + yourPts, optPts: s.optPts + optPts }));
    }
    dealNewHand();
  }

  const sessionEfficiency = session.optPts > 0
    ? Math.round(session.yourPts / session.optPts * 100) : 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: t.surfaceBg }}>

      {/* ── Top bar: efficiency-forward session header ──────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: "8px 16px",
        background: t.surfaceBg, borderBottom: `1px solid ${t.border}`,
      }}>
        <SessionStatStrip
          hands={session.hands}
          yourPts={session.yourPts}
          optPts={session.optPts}
          efficiency={sessionEfficiency}
          t={t}
        />
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 8px", background: "#0e2318" }}>

        {phase === "discard" && <DiscardBody isDealer={isDealer} t={t} />}
        {phase === "score" && (
          <ScoreBody
            feedback={feedback}
            kept={kept} cut={cut}
            handResult={handResult} cribResult={cribResult}
            optHandResult={optHandResult} optResult={optResult}
            isDealer={isDealer} session={session} t={t}
          />
        )}

      </div>

      {/* ── Bottom dock — sticky ─────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: t.surfaceBg, borderTop: `1px solid ${t.border}` }}>

        <PhaseStrip phase={phase} t={t} />

        {/* Card shelf */}
        <div style={{
          padding: "0 16px 10px",
          display: "flex", justifyContent: "center", alignItems: "flex-end",
        }}>
          {phase === "discard" && (
            <CardFan
              cards={hand6}
              selected={selected}
              onSelect={toggleSelect}
              dimOthers={selected.length === 2}
              t={t}
            />
          )}
          {phase === "score" && kept.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
              <CardFan cards={kept} t={t} />
              {cut && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>cut</span>
                  <PlayingCard card={cut} t={t} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action row */}
        <div style={{ padding: "0 16px", paddingBottom: "calc(16px + env(safe-area-inset-bottom))", display: "flex", gap: 8 }}>
          {phase === "discard" && (
            <ActionButton
              label={selected.length === 2 ? "Discard →" : `Select ${2 - selected.length} more card${2 - selected.length === 1 ? "" : "s"}`}
              disabled={selected.length !== 2}
              onClick={confirmDiscard}
              t={t}
            />
          )}
          {phase === "score" && (
            <ActionButton label="Deal New Hand →" onClick={handleDealNewHand} t={t} />
          )}
        </div>

      </div>
    </div>
  );
}
