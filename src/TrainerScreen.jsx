import { useState, useEffect, useRef } from "react";

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
  if (starter?.suit === s) return { pts: 5, log: [{ pts: 5, reason: "Flush — 5 cards", cards: [...hand4, starter] }] };
  if (!isCrib) return { pts: 4, log: [{ pts: 4, reason: "Flush — 4 cards", cards: hand4 }] };
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

function evHand(h4, exclSet) {
  const remaining = fullDeck().filter(c => !exclSet.has(cardKey(c)));
  const step = Math.max(1, Math.floor(remaining.length / 22));
  let total = 0, count = 0;
  for (let i = 0; i < remaining.length; i += step) {
    total += scoreHand(h4, remaining[i], false).total;
    count++;
  }
  return count > 0 ? total / count : 0;
}

function evCrib(d2, exclSet) {
  const remaining = fullDeck().filter(c => !exclSet.has(cardKey(c)));
  const shuffled = [...remaining].sort(() => Math.random() - 0.5);
  let total = 0, count = 0;
  for (let i = 0; i + 2 < shuffled.length && count < 16; i += 3) {
    const opp = [shuffled[i], shuffled[i + 1]];
    const cut = shuffled[i + 2];
    total += scoreHand([...d2, ...opp], cut, true).total;
    count++;
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

// ─── Pegging ─────────────────────────────────────────────────────────────────

function pegSum(pile) { return pile.reduce((s, c) => s + cardValue(c.rank), 0); }

function scorePeg(pile) {
  if (!pile.length) return { pts: 0, reasons: [] };
  const sum = pegSum(pile);
  let pts = 0, reasons = [];
  if (sum === 15) { pts += 2; reasons.push("Fifteen 2"); }
  if (sum === 31) { pts += 2; reasons.push("31 for 2"); }
  // Pairs
  let pLen = 1;
  for (let i = pile.length - 2; i >= 0; i--) {
    if (pile[i].rank === pile[pile.length - 1].rank) pLen++;
    else break;
  }
  if (pLen >= 2) {
    const pp = [0, 0, 2, 6, 12][pLen];
    pts += pp;
    reasons.push(`${pLen === 2 ? "Pair" : pLen === 3 ? "Pair Royal" : "Double Pair Royal"} ${pp}`);
  }
  // Runs
  for (let len = Math.min(pile.length, 7); len >= 3; len--) {
    const tail = pile.slice(pile.length - len);
    const idxs = tail.map(c => rankIdx(c.rank)).sort((a, b) => a - b);
    if (idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1)) {
      pts += len; reasons.push(`Run of ${len}`); break;
    }
  }
  return { pts, reasons };
}

function oppBestCard(hand, pile) {
  const sum = pegSum(pile);
  const playable = hand.filter(c => cardValue(c.rank) + sum <= 31);
  if (!playable.length) return null;
  let best = null, bestScore = -Infinity;
  for (const card of playable) {
    const newSum = sum + cardValue(card.rank);
    const { pts } = scorePeg([...pile, card]);
    const penalty = (newSum === 5 || newSum === 21) ? 3 : 0;
    const s = pts - penalty;
    if (s > bestScore) { bestScore = s; best = card; }
  }
  return best;
}

// ─── Card Component ──────────────────────────────────────────────────────────

function PlayingCard({ card, selected, dimmed, faceDown, onClick, small, t }) {
  const w = small ? 40 : 52, h = small ? 58 : 76;
  if (faceDown) {
    return (
      <div style={{
        width: w, height: h, borderRadius: 6, flexShrink: 0,
        background: "repeating-linear-gradient(45deg,#0a3d1f 0,#0a3d1f 4px,#0d4a25 4px,#0d4a25 8px)",
        border: "2px solid #1a6b3a", boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
      }} />
    );
  }
  const red = card && isRed(card.suit);
  return (
    <div
      onClick={onClick}
      style={{
        width: w, height: h, borderRadius: 6, flexShrink: 0,
        background: "#f5f0e8",
        border: `2px solid ${selected ? t.accentYellow : "rgba(0,0,0,0.12)"}`,
        boxShadow: selected
          ? `0 6px 14px rgba(0,0,0,0.5), 0 0 0 1px ${t.accentYellow}`
          : "0 2px 6px rgba(0,0,0,0.4)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        transform: selected ? "translateY(-12px)" : "none",
        transition: "transform 0.15s ease, border-color 0.15s, box-shadow 0.15s, opacity 0.15s",
        opacity: dimmed ? 0.25 : 1,
        userSelect: "none", WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 3, left: 4, lineHeight: 1, textAlign: "center" }}>
        <div style={{ fontSize: card?.rank === "10" ? 9 : 10, fontWeight: 800, color: red ? "#b91c1c" : "#1c1c1e", fontFamily: "Georgia,serif" }}>{card?.rank}</div>
        <div style={{ fontSize: 9, color: red ? "#b91c1c" : "#1c1c1e" }}>{card?.suit}</div>
      </div>
      <span style={{ fontSize: small ? 18 : 22, color: red ? "#b91c1c" : "#1c1c1e", lineHeight: 1 }}>{card?.suit}</span>
      <div style={{ position: "absolute", bottom: 3, right: 4, lineHeight: 1, textAlign: "center", transform: "rotate(180deg)" }}>
        <div style={{ fontSize: card?.rank === "10" ? 9 : 10, fontWeight: 800, color: red ? "#b91c1c" : "#1c1c1e", fontFamily: "Georgia,serif" }}>{card?.rank}</div>
        <div style={{ fontSize: 9, color: red ? "#b91c1c" : "#1c1c1e" }}>{card?.suit}</div>
      </div>
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
      fontFamily: "Georgia,serif",
    }}>{card.rank}{card.suit}</span>
  );
}

function PhaseStrip({ phase, t }) {
  const phases = ["discard", "pegging", "score", "results"];
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

function StatChip({ label, value, t }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, fontFamily: "Georgia,serif" }}>{value}</div>
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
    }}>{label}</button>
  );
}

function SectionBlock({ title, children, t, accent }) {
  return (
    <div style={{
      background: t.surfaceBg, borderRadius: 10, padding: "12px 14px",
      border: `1px solid ${accent || t.border}`,
      marginBottom: 0,
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
      <div style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary, fontFamily: "Georgia,serif" }}>{value}</div>
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

function PegLogEntry({ entry, t }) {
  if (entry.go) return (
    <div style={{ fontSize: 12, color: t.textMuted, padding: "2px 0" }}>
      <span style={{ color: t.textSecondary, fontWeight: 600 }}>{entry.who}</span>: Go
    </div>
  );
  if (entry.reset) return (
    <div style={{ fontSize: 11, color: t.textMuted, padding: "2px 0", fontStyle: "italic" }}>— New pile —</div>
  );
  if (entry.lastCard) return (
    <div style={{ fontSize: 12, color: t.textSecondary, padding: "2px 0" }}>
      <span style={{ fontWeight: 600 }}>{entry.who}</span>: Last card <span style={{ color: t.accentYellow, fontWeight: 700 }}>+1</span>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
      <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 600, minWidth: 28 }}>{entry.who}:</span>
      <MiniCard card={entry.card} t={t} />
      <span style={{ fontSize: 12, color: t.textMuted }}>= {entry.sum}</span>
      {entry.pts > 0 && (
        <span style={{ fontSize: 12, fontWeight: 700, color: t.accentYellow, marginLeft: 2 }}>+{entry.pts}</span>
      )}
    </div>
  );
}

// ─── Phase body sections ─────────────────────────────────────────────────────

function DiscardBody({ feedback, t }) {
  if (!feedback) return (
    <div style={{ textAlign: "center", color: t.textSecondary, fontSize: 14, paddingTop: 24 }}>
      Select 2 cards to discard to the crib
    </div>
  );
  const gradeColor = feedback.grade === "Optimal" ? "#34d399" : feedback.grade === "Close" ? "#fb923c" : "#f87171";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SectionBlock t={t} accent={gradeColor}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: gradeColor }}>
            {feedback.grade === "Optimal" ? "✓ Optimal" : feedback.grade === "Close" ? "≈ Close" : "✗ Suboptimal"}
          </span>
          <span style={{ fontSize: 12, color: t.textSecondary }}>
            {feedback.evDiff >= 0 ? "+" : ""}{feedback.evDiff.toFixed(2)} EV
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: feedback.grade !== "Optimal" ? 10 : 0 }}>
          <EVCell label="Your EV" value={feedback.playerEV.toFixed(2)} t={t} />
          <EVCell label="Optimal EV" value={feedback.optEV.toFixed(2)} t={t} />
          <EVCell label="Hand EV" value={feedback.playerHandEV.toFixed(2)} t={t} />
          <EVCell label="Crib EV" value={feedback.playerCribEV.toFixed(2)} t={t} />
        </div>
        {feedback.grade !== "Optimal" && (
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            Optimal keep:{" "}
            {feedback.optKeep.map(c => (
              <span key={cardKey(c)} style={{ color: isRed(c.suit) ? t.redCard : t.blueCard, fontWeight: 700, marginRight: 4, fontFamily: "Georgia,serif" }}>
                {c.rank}{c.suit}
              </span>
            ))}
          </div>
        )}
      </SectionBlock>
    </div>
  );
}

function PeggingBody({ pileSum, pegPile, playerScore, oppScore, pegLog, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Pile sum */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Count</div>
        <div style={{
          fontSize: 56, fontWeight: 900, lineHeight: 1,
          color: pileSum >= 28 ? "#f87171" : pileSum >= 20 ? "#fb923c" : t.textPrimary,
          fontFamily: "Georgia,serif",
        }}>{pileSum}</div>
        {pegPile.length > 0 && (
          <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
            {pegPile.map((c, i) => <MiniCard key={i + cardKey(c)} card={c} t={t} />)}
          </div>
        )}
      </div>
      {/* Scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[{ label: "You", value: playerScore }, { label: "Opp", value: oppScore }].map(({ label, value }) => (
          <div key={label} style={{
            background: t.surfaceBg, borderRadius: 8, padding: "8px 12px",
            textAlign: "center", border: `1px solid ${t.border}`,
          }}>
            <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: t.textPrimary, fontFamily: "Georgia,serif" }}>{value}</div>
          </div>
        ))}
      </div>
      {/* Play log */}
      {pegLog.length > 0 && (
        <SectionBlock title="Play log" t={t}>
          {pegLog.slice(0, 10).map((entry, i) => <PegLogEntry key={i} entry={entry} t={t} />)}
        </SectionBlock>
      )}
    </div>
  );
}

function ScoreBody({ kept, cut, handResult, cribResult, optHandResult, optKeep, playerScore, oppScore, isDealer, pegLog, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SectionBlock title="Your Hand" t={t}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {kept.map(c => <MiniCard key={cardKey(c)} card={c} t={t} />)}
          <span style={{ color: t.textMuted, fontSize: 12, alignSelf: "center" }}>+</span>
          {cut && <MiniCard card={cut} t={t} />}
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: t.accentYellow, fontFamily: "Georgia,serif", marginBottom: 10 }}>
          {handResult.total} pts
        </div>
        {handResult.log.map((item, i) => <ScoreLogRow key={i} item={item} t={t} />)}
        {!handResult.log.length && <div style={{ fontSize: 13, color: t.textSecondary }}>No scoring combinations</div>}
      </SectionBlock>

      {optKeep && optHandResult && optHandResult.total !== handResult.total && (
        <SectionBlock title="Optimal keep would have scored" t={t} accent="#fb923c">
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            {optKeep.map(c => <MiniCard key={cardKey(c)} card={c} t={t} />)}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.textSecondary, fontFamily: "Georgia,serif" }}>
            {optHandResult.total} pts
          </div>
        </SectionBlock>
      )}

      {isDealer && cribResult && (
        <SectionBlock title="Your Crib" t={t}>
          <div style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, fontFamily: "Georgia,serif", marginBottom: 8 }}>
            {cribResult.total} pts
          </div>
          {cribResult.log.map((item, i) => <ScoreLogRow key={i} item={item} t={t} />)}
          {!cribResult.log.length && <div style={{ fontSize: 13, color: t.textSecondary }}>No scoring combinations</div>}
        </SectionBlock>
      )}

      <SectionBlock title="Pegging" t={t}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[{ label: "You", value: playerScore }, { label: "Opp", value: oppScore }].map(({ label, value }) => (
            <div key={label} style={{ background: t.surfaceSunken, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.textPrimary, fontFamily: "Georgia,serif" }}>{value}</div>
            </div>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}

function ResultsBody({ handPts, cribPts, pegPts, yourTotal, optTotal, isDealer, session, efficiency, t }) {
  const leftOnTable = Math.max(0, optTotal - yourTotal);
  const effColor = efficiency >= 90 ? "#34d399" : efficiency >= 75 ? "#fb923c" : "#f87171";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SectionBlock title="This Hand" t={t}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <EVCell label="Your Score" value={yourTotal} t={t} />
          <EVCell label="Optimal" value={optTotal} t={t} />
          <EVCell label="Hand Pts" value={handPts} t={t} />
          <EVCell label="Pegging Pts" value={pegPts} t={t} />
        </div>
        {isDealer && <EVCell label="Crib Pts" value={cribPts} t={t} />}
        {leftOnTable > 0 && (
          <div style={{ marginTop: 8, fontSize: 13, color: "#f87171", fontWeight: 600 }}>
            Left on table: {leftOnTable} pts
          </div>
        )}
      </SectionBlock>

      <SectionBlock title="Session" t={t}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
          <StatChip label="Hands" value={session.hands} t={t} />
          <StatChip label="Your Pts" value={session.yourPts} t={t} />
          <StatChip label="Opt Pts" value={session.optPts} t={t} />
        </div>
        <div style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          Efficiency
        </div>
        <div style={{ background: t.surfaceRaised, borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 6 }}>
          <div style={{
            height: "100%", width: `${Math.min(100, efficiency)}%`,
            background: "linear-gradient(to right,#f87171,#fb923c,#f5b800,#34d399)",
            borderRadius: 6, transition: "width 0.6s ease-out",
          }} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: effColor, fontFamily: "Georgia,serif" }}>{efficiency}%</div>
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
  const [selected, setSelected] = useState([]);   // discard phase: indices
  const [kept, setKept] = useState([]);
  const [discarded, setDiscarded] = useState([]);
  const [cut, setCut] = useState(null);
  const [optResult, setOptResult] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Pegging
  const [pegPile, setPegPile] = useState([]);
  const [playerPeg, setPlayerPeg] = useState([]);
  const [oppPeg, setOppPeg] = useState([]);
  const [oppKept, setOppKept] = useState([]);
  const [pegTurn, setPegTurn] = useState("player");
  const [playerScore, setPlayerScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [pegLog, setPegLog] = useState([]);
  const [pegDone, setPegDone] = useState(false);
  const [playerPassed, setPlayerPassed] = useState(false);
  const [oppPassed, setOppPassed] = useState(false);

  // Score phase
  const [handResult, setHandResult] = useState(null);
  const [cribResult, setCribResult] = useState(null);
  const [optHandResult, setOptHandResult] = useState(null);

  // Ref for fresh state in timeouts
  const g = useRef({});
  g.current = { pegPile, playerPeg, oppPeg, playerScore, oppScore, pegTurn, playerPassed, oppPassed, pegDone, phase };

  // Opponent auto-play effect
  useEffect(() => {
    if (phase !== "pegging" || pegTurn !== "opp" || pegDone) return;
    const id = setTimeout(() => {
      const { oppPeg: oPeg, playerPeg: pPeg, pegPile: pile, playerScore: pScore, oppScore: oScore,
        playerPassed: pPassed, oppPassed: oPassed, pegDone: done, phase: ph } = g.current;
      if (ph !== "pegging" || done) return;

      const oppCard = oppBestCard(oPeg, pile);
      if (!oppCard) {
        // Opponent passes
        setPegLog(prev => [{ who: "Opp", go: true }, ...prev]);
        if (pPassed) {
          // Both passed — reset pile, give last-card +1 to whoever played last
          const newPScore = pScore + 1;
          setPlayerScore(newPScore);
          setPegLog(prev => [{ who: "You", lastCard: true, pts: 1 }, ...prev]);
          setPegPile([]);
          setPlayerPassed(false);
          setOppPassed(false);
          if (!pPeg.length && !oPeg.length) {
            setPegDone(true);
            setTimeout(() => setPhase("score"), 600);
          } else {
            setPegTurn(isDealer ? "opp" : "player");
          }
        } else {
          setOppPassed(true);
          setPegTurn("player");
        }
        return;
      }

      const newPile = [...pile, oppCard];
      const newOPeg = oPeg.filter(c => cardKey(c) !== cardKey(oppCard));
      const { pts, reasons } = scorePeg(newPile);
      const newOScore = oScore + pts;
      const sum = pegSum(newPile);

      setOppPeg(newOPeg);
      setOppScore(newOScore);
      setPegPile(newPile);
      setOppPassed(false);
      setPegLog(prev => [{ who: "Opp", card: oppCard, pts, reasons, sum }, ...prev]);

      if (sum === 31) {
        setOppScore(s => s + 2); // 31 already counted in pts above — this is already right
        setTimeout(() => {
          setPegPile([]);
          setPlayerPassed(false);
          setOppPassed(false);
          setPegLog(prev => [{ reset: true }, ...prev]);
          if (!pPeg.length && !newOPeg.length) {
            setPegDone(true);
            setTimeout(() => setPhase("score"), 400);
          } else {
            setPegTurn(isDealer ? "opp" : "player");
          }
        }, 400);
      } else if (!pPeg.length && !newOPeg.length) {
        // Last card — opponent played last, so they get +1
        setOppScore(s => s + 1);
        setPegLog(prev => [{ who: "Opp", lastCard: true, pts: 1 }, ...prev]);
        setPegDone(true);
        setTimeout(() => setPhase("score"), 600);
      } else {
        setPegTurn("player");
      }
    }, 600);
    return () => clearTimeout(id);
  }, [pegTurn, phase, pegDone]); // eslint-disable-line

  // Compute scores when entering score phase
  useEffect(() => {
    if (phase !== "score" || !kept.length || !cut) return;
    setHandResult(scoreHand(kept, cut, false));
    if (isDealer && discarded.length >= 2) {
      // Simplified crib: player's discards + 2 random opp discards + cut
      const usedKeys = new Set([...kept.map(cardKey), ...discarded.map(cardKey), cardKey(cut), ...oppKept.map(cardKey)]);
      const rem = fullDeck().filter(c => !usedKeys.has(cardKey(c)));
      const oDiscard = rem.sort(() => Math.random() - 0.5).slice(0, 2);
      setCribResult(scoreHand([...discarded, ...oDiscard], cut, true));
    }
    if (optResult) setOptHandResult(scoreHand(optResult.keep, cut, false));
  }, [phase]); // eslint-disable-line

  function dealNewHand() {
    const deck = [...fullDeck()].sort(() => Math.random() - 0.5);
    const newHand6 = deck.slice(0, 6).sort((a, b) => rankIdx(a.rank) - rankIdx(b.rank));
    const newIsDealer = Math.random() > 0.5;
    setHand6(newHand6);
    setIsDealer(newIsDealer);
    setSelected([]); setKept([]); setDiscarded([]); setCut(null);
    setOptResult(null); setFeedback(null);
    setPegPile([]); setPlayerPeg([]); setOppPeg([]); setOppKept([]);
    setPlayerScore(0); setOppScore(0); setPegLog([]);
    setPegDone(false); setPlayerPassed(false); setOppPassed(false);
    setHandResult(null); setCribResult(null); setOptHandResult(null);
    setPhase("discard");
  }

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

    const usedKeys = new Set(hand6.map(cardKey));
    const remaining = fullDeck().filter(c => !usedKeys.has(cardKey(c)));
    const cutCard = remaining[Math.floor(Math.random() * remaining.length)];

    const exclSet = new Set(hand6.map(cardKey));
    const playerHandEV = evHand(keptCards, exclSet);
    const playerCribEV = evCrib(discardedCards, exclSet);
    const playerEV = playerHandEV + (isDealer ? 0.5 : -0.5) * playerCribEV;
    const opt = bestKeep(hand6, isDealer);
    const evDiff = playerEV - opt.ev;
    const grade = evDiff >= -0.5 ? "Optimal" : evDiff >= -1.5 ? "Close" : "Suboptimal";

    // Opponent's hand
    const rem2 = remaining.filter(c => cardKey(c) !== cardKey(cutCard));
    const opp6 = rem2.sort(() => Math.random() - 0.5).slice(0, 6);
    const oppOpt = bestKeep(opp6, !isDealer);

    setKept(keptCards); setDiscarded(discardedCards); setCut(cutCard);
    setOptResult(opt);
    setFeedback({ playerEV, playerHandEV, playerCribEV, optEV: opt.ev, optHandEV: opt.hEV, optCribEV: opt.cEV, optKeep: opt.keep, grade, evDiff });
    setPlayerPeg([...keptCards]);
    setOppPeg([...oppOpt.keep]); setOppKept([...oppOpt.keep]);
    setPegTurn(isDealer ? "opp" : "player");
    setPhase("pegging");
  }

  function playerPlayCard(card) {
    const { pegPile: pile, playerScore: pScore, oppScore: oScore, playerPeg: pPeg, oppPeg: oPeg } = g.current;
    if (!pPeg.some(c => cardKey(c) === cardKey(card))) return;
    if (cardValue(card.rank) + pegSum(pile) > 31) return;

    const newPile = [...pile, card];
    const newPPeg = pPeg.filter(c => cardKey(c) !== cardKey(card));
    const { pts, reasons } = scorePeg(newPile);
    const newPScore = pScore + pts;
    const sum = pegSum(newPile);

    setPlayerPeg(newPPeg); setPlayerScore(newPScore); setPegPile(newPile);
    setPlayerPassed(false);
    setPegLog(prev => [{ who: "You", card, pts, reasons, sum }, ...prev]);

    if (sum === 31) {
      setTimeout(() => {
        setPegPile([]); setPlayerPassed(false); setOppPassed(false);
        setPegLog(prev => [{ reset: true }, ...prev]);
        const { oppPeg: freshOPeg } = g.current;
        if (!newPPeg.length && !freshOPeg.length) {
          setPegDone(true);
          setTimeout(() => setPhase("score"), 400);
        } else {
          setPegTurn("opp");
        }
      }, 400);
    } else if (!newPPeg.length && !oPeg.length) {
      setPlayerScore(s => s + 1);
      setPegLog(prev => [{ who: "You", lastCard: true, pts: 1 }, ...prev]);
      setPegDone(true);
      setTimeout(() => setPhase("score"), 600);
    } else {
      setPegTurn("opp");
    }
  }

  function playerGo() {
    const { pegPile: pile, playerScore: pScore, oppScore: oScore, playerPeg: pPeg, oppPeg: oPeg, oppPassed: oPassed } = g.current;
    setPlayerPassed(true);
    setPegLog(prev => [{ who: "You", go: true }, ...prev]);
    if (oPassed) {
      // Both passed — reset pile, give last card +1 to last who played (just +1 for player here)
      setPlayerScore(s => s + 1);
      setPegLog(prev => [{ who: "You", lastCard: true, pts: 1 }, ...prev]);
      setPegPile([]); setPlayerPassed(false); setOppPassed(false);
      setPegLog(prev => [{ reset: true }, ...prev]);
      if (!pPeg.length && !oPeg.length) {
        setPegDone(true);
        setTimeout(() => setPhase("score"), 600);
      } else {
        setPegTurn(isDealer ? "opp" : "player");
      }
    } else {
      setPegTurn("opp");
    }
  }

  function goToResults() {
    const hPts = handResult?.total || 0;
    const cPts = isDealer ? (cribResult?.total || 0) : 0;
    const optH = optHandResult?.total || 0;
    const yourTotal = hPts + playerScore + cPts;
    const optTotal = optH + playerScore + cPts;
    setSession(prev => ({
      hands: prev.hands + 1,
      yourPts: prev.yourPts + yourTotal,
      optPts: prev.optPts + optTotal,
    }));
    setPhase("results");
  }

  const efficiency = session.optPts > 0 ? Math.round(session.yourPts / session.optPts * 100) : 100;
  const pileSum = pegSum(pegPile);
  const playerCanPlay = phase === "pegging" && !pegDone && pegTurn === "player"
    && playerPeg.some(c => cardValue(c.rank) + pileSum <= 31);

  const shelfCards = phase === "discard" ? hand6 : kept;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: t.surfaceBg }}>

      {/* Top bar */}
      <div style={{
        flexShrink: 0, padding: "10px 16px",
        background: t.surfaceBg, borderBottom: `1px solid ${t.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: 20 }}>
          <StatChip label="Hands" value={session.hands} t={t} />
          <StatChip label="Efficiency" value={`${efficiency}%`} t={t} />
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <StatChip label="Your pts" value={session.yourPts} t={t} />
          <StatChip label="Opt pts" value={session.optPts} t={t} />
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 8px", background: "#0e2318" }}>
        {/* Role badge */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: t.accentYellow, letterSpacing: 1,
            textTransform: "uppercase", background: t.accentYellow + "22",
            borderRadius: 6, padding: "3px 10px",
          }}>{isDealer ? "🃏 Dealer" : "🎴 Pone"}</span>
        </div>

        {phase === "discard" && <DiscardBody feedback={feedback} t={t} />}
        {phase === "pegging" && (
          <PeggingBody pileSum={pileSum} pegPile={pegPile} playerScore={playerScore} oppScore={oppScore} pegLog={pegLog} t={t} />
        )}
        {phase === "score" && handResult && (
          <ScoreBody
            kept={kept} cut={cut} handResult={handResult} cribResult={cribResult}
            optHandResult={optHandResult} optKeep={optResult?.keep}
            playerScore={playerScore} oppScore={oppScore} isDealer={isDealer}
            pegLog={pegLog} t={t}
          />
        )}
        {phase === "results" && (
          <ResultsBody
            handPts={handResult?.total || 0}
            cribPts={isDealer ? (cribResult?.total || 0) : 0}
            pegPts={playerScore}
            yourTotal={(handResult?.total || 0) + playerScore + (isDealer ? (cribResult?.total || 0) : 0)}
            optTotal={(optHandResult?.total || 0) + playerScore + (isDealer ? (cribResult?.total || 0) : 0)}
            isDealer={isDealer} session={session} efficiency={efficiency} t={t}
          />
        )}
      </div>

      {/* Bottom dock */}
      <div style={{ flexShrink: 0, background: t.surfaceBg, borderTop: `1px solid ${t.border}` }}>
        <PhaseStrip phase={phase} t={t} />

        {/* Card shelf */}
        <div style={{
          padding: "14px 16px 8px", display: "flex", gap: 6,
          alignItems: "flex-end", overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}>
          {phase === "discard" && hand6.map((card, i) => (
            <PlayingCard key={cardKey(card)} card={card} selected={selected.includes(i)} onClick={() => toggleSelect(i)} t={t} />
          ))}
          {phase !== "discard" && kept.map(card => {
            const inHand = phase === "pegging" && playerPeg.some(c => cardKey(c) === cardKey(card));
            const isPlayable = inHand && cardValue(card.rank) + pileSum <= 31 && pegTurn === "player" && !pegDone;
            const dimmed = phase === "pegging" && !inHand;
            return (
              <PlayingCard
                key={cardKey(card)} card={card} dimmed={dimmed}
                onClick={isPlayable ? () => playerPlayCard(card) : undefined}
                t={t}
              />
            );
          })}
          {phase !== "discard" && cut && (
            <>
              <div style={{ width: 1, background: t.border, alignSelf: "stretch", margin: "0 4px", flexShrink: 0 }} />
              <PlayingCard card={cut} t={t} />
            </>
          )}
        </div>

        {/* Action row */}
        <div style={{ padding: "0 16px 16px", display: "flex", gap: 8 }}>
          {phase === "discard" && (
            <ActionButton
              label={selected.length === 2 ? "Discard →" : `Select ${2 - selected.length} more to discard`}
              disabled={selected.length !== 2}
              onClick={confirmDiscard}
              t={t}
            />
          )}
          {phase === "pegging" && !pegDone && pegTurn === "player" && playerCanPlay && (
            <div style={{ flex: 1, textAlign: "center", padding: "12px 0", color: t.accentYellow, fontSize: 13, fontWeight: 600 }}>
              Tap a card above to play
            </div>
          )}
          {phase === "pegging" && !pegDone && pegTurn === "player" && !playerCanPlay && (
            <ActionButton label="Go →" onClick={playerGo} t={t} />
          )}
          {phase === "pegging" && !pegDone && pegTurn === "opp" && (
            <div style={{ flex: 1, textAlign: "center", padding: "12px 0", color: t.textSecondary, fontSize: 13 }}>
              Opponent is playing…
            </div>
          )}
          {phase === "pegging" && pegDone && (
            <ActionButton label="See Score →" onClick={() => setPhase("score")} t={t} />
          )}
          {phase === "score" && (
            <ActionButton label="See Results →" onClick={goToResults} t={t} />
          )}
          {phase === "results" && (
            <ActionButton label="Deal New Hand →" onClick={dealNewHand} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}
