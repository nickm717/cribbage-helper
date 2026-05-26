import { useState, useEffect } from "react";
import TrainerScreenComponent from "./TrainerScreen.jsx";

// ─── Scoring Engine ────────────────────────────────────────────────────────

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
  const uniq = raw.flatMap(p=>p).filter((c,i,a)=>a.findIndex(x=>cardKey(x)===cardKey(c))===i);
  const n = pts / 2;
  const reason = n === 1 ? "Pair" : n === 3 ? "Pair Royal (3 of a kind)" : "Double Pair Royal (4 of a kind)";
  return { pts, log: [{ pts, reason, cards: uniq }] };
}

function scoreRuns(cards) {
  let pts = 0, log = [];
  for (let sz = 5; sz >= 3; sz--) {
    const runs = [];
    combos(cards, sz).forEach(combo => {
      const idxs = combo.map(c => rankIdx(c.rank)).sort((a,b)=>a-b);
      if (idxs.every((v,i) => i===0 || v===idxs[i-1]+1)) runs.push(combo);
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
  return { total: parts.reduce((s,p)=>s+p.pts,0), log: parts.flatMap(p=>p.log) };
}

// ─── Theme tokens — The Card Room ─────────────────────────────────────────
//
// Source of truth: DESIGN.md. OKLCH authored; values inlined here so the
// runtime doesn't depend on browser CSS-color-4 support for JS-style props.
// All contrast ratios verified against WCAG AA (4.5:1 normal text, 3:1 UI).
//
// Old token names (pageBg, surfaceBg, accentYellow, redCard, scoreAccents, …)
// are retained as aliases pointing to the new Card Room values so existing
// call-sites keep working. New canonical names (feltDeep, feltBase, goldBright,
// scorePositive, tierGrade, fontUi, fontCard, fontMono) live alongside.

const FONT_UI   = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const FONT_CARD = "'Spectral', Georgia, 'Times New Roman', serif";
const FONT_MONO = "'SF Mono', ui-monospace, 'Cascadia Mono', 'Roboto Mono', 'Menlo', monospace";

function makeTheme(dark) {
  if (dark) {
    // Dark mode — The Card Room at midnight
    const feltDeep      = "oklch(18% 0.030 145)";   // canvas. AAA backdrop.
    const feltBase      = "oklch(24% 0.038 148)";   // primary surface (containers, header)
    const feltMid       = "oklch(30% 0.042 150)";   // raised (rows, secondary buttons, dock)
    const feltLift      = "oklch(36% 0.040 152)";   // highest felt (hover, borders)
    const feltRule      = "oklch(28% 0.028 148)";   // hairline divider
    const cardFace      = "oklch(96% 0.012 88)";    // playing-card cream
    const cardWarm      = "oklch(92% 0.018 82)";    // cut card / second cream
    const goldBright    = "oklch(78% 0.138 78)";    // the one accent
    const goldMuted     = "oklch(68% 0.100 80)";    // hover / secondary gold
    const goldDim       = "oklch(58% 0.070 82)";    // decorative gold (borders, glyphs)
    const goldGlow      = "oklch(78% 0.138 78 / 0.18)";
    const scorePositive = "oklch(72% 0.130 150)";   // earned points (green)
    const scoreMiss     = "oklch(60% 0.130 25)";    // missed points (red)
    const suitRed       = "oklch(60% 0.185 25)";    // ♥♦ on cream card face
    const suitDark      = "oklch(20% 0.018 148)";   // ♠♣ on cream card face
    const textPrimary   = "oklch(94% 0.012 88)";    // 15.7:1 on feltDeep
    const textSecondary = "oklch(70% 0.022 100)";   // 5.0:1 on feltMid
    const textMuted     = "oklch(68% 0.018 100)";   // 4.7:1 on feltMid — legibility floor
    const textDisabled  = "oklch(48% 0.015 100)";
    return {
      dark: true,
      // Canonical Card Room names
      feltDeep, feltBase, feltMid, feltLift, feltRule,
      cardFace, cardWarm,
      goldBright, goldMuted, goldDim, goldGlow,
      scorePositive, scoreMiss,
      suitRed, suitDark,
      textPrimary, textSecondary, textMuted, textDisabled,
      textOnCard: "oklch(20% 0.025 145)",
      textOnGold: "oklch(18% 0.030 80)",
      // Four-step tier-grade palette: [poor, fair, good, strong]
      tierGrade: [
        "oklch(60% 0.130 25)",  // poor — under 60%
        "oklch(70% 0.140 50)",  // fair — 60–74
        "oklch(78% 0.138 78)",  // good — 75–89 (same as goldBright)
        "oklch(72% 0.130 150)", // strong — 90+ (same as scorePositive)
      ],
      // Typography stacks
      fontUi: FONT_UI, fontCard: FONT_CARD, fontMono: FONT_MONO,
      // Legacy aliases — point old names at new Card Room values
      pageBg:        feltDeep,
      surfaceBg:     feltBase,
      surfaceRaised: feltMid,
      surfaceSunken: feltDeep,
      border:        feltRule,
      accentYellow:  goldBright,
      redCard:       suitRed,
      blueCard:      suitDark,
      // Suit-row tinted backgrounds. Lightness bumped above felt-mid so the
      // suit row reads as a clearly raised step. Hue tint stays subtle so
      // the felt-room aesthetic isn't disrupted.
      redSuitBg:     "oklch(38% 0.060 25)",
      blueSuitBg:    "oklch(38% 0.030 240)",
      redSuitHover:  "oklch(46% 0.080 25)",
      blueSuitHover: "oklch(46% 0.040 240)",
      // Legacy scoreAccents → tierGrade aliased in old [worst→best] order
      scoreAccents: [
        "oklch(60% 0.130 25)",
        "oklch(70% 0.140 50)",
        "oklch(78% 0.138 78)",
        "oklch(72% 0.130 150)",
      ],
    };
  }
  // Light mode — Daylight Card Room
  const feltDeep      = "oklch(88% 0.022 75)";    // warm linen canvas
  const feltBase      = "oklch(94% 0.012 88)";    // primary surface (pale cream)
  const feltMid       = "oklch(91% 0.014 85)";    // raised (warm off-cream)
  const feltLift      = "oklch(85% 0.018 80)";    // borders, hover
  const feltRule      = "oklch(78% 0.018 80)";    // hairlines
  const cardFace      = "oklch(98% 0.008 90)";    // brighter than surfaces; cards pop
  const cardWarm      = "oklch(95% 0.012 85)";
  const goldBright    = "oklch(55% 0.130 75)";    // deeper bronze; ~5:1 on cream
  const goldMuted     = "oklch(45% 0.110 78)";
  const goldDim       = "oklch(60% 0.090 82)";
  const goldGlow      = "oklch(55% 0.130 75 / 0.20)";
  const scorePositive = "oklch(45% 0.150 150)";
  const scoreMiss     = "oklch(50% 0.180 25)";
  const suitRed       = "oklch(48% 0.190 25)";    // ♥♦ on cream card face (light)
  const suitDark      = "oklch(20% 0.018 148)";
  const textPrimary   = "oklch(22% 0.020 80)";
  const textSecondary = "oklch(40% 0.022 85)";
  const textMuted     = "oklch(50% 0.020 90)";
  const textDisabled  = "oklch(70% 0.015 85)";
  return {
    dark: false,
    feltDeep, feltBase, feltMid, feltLift, feltRule,
    cardFace, cardWarm,
    goldBright, goldMuted, goldDim, goldGlow,
    scorePositive, scoreMiss,
    suitRed, suitDark,
    textPrimary, textSecondary, textMuted, textDisabled,
    textOnCard: "oklch(20% 0.025 145)",
    textOnGold: "oklch(98% 0.010 80)",
    tierGrade: [
      "oklch(50% 0.180 25)",
      "oklch(55% 0.150 60)",
      "oklch(55% 0.130 75)",
      "oklch(45% 0.150 150)",
    ],
    fontUi: FONT_UI, fontCard: FONT_CARD, fontMono: FONT_MONO,
    // Legacy aliases
    pageBg:        feltDeep,
    surfaceBg:     feltBase,
    surfaceRaised: feltMid,
    surfaceSunken: feltDeep,
    border:        feltRule,
    accentYellow:  goldBright,
    redCard:       suitRed,
    blueCard:      suitDark,
    redSuitBg:     "oklch(93% 0.035 25)",
    blueSuitBg:    "oklch(92% 0.025 240)",
    redSuitHover:  "oklch(88% 0.050 25)",
    blueSuitHover: "oklch(86% 0.035 240)",
    scoreAccents: [
      "oklch(50% 0.180 25)",
      "oklch(55% 0.150 60)",
      "oklch(55% 0.130 75)",
      "oklch(45% 0.150 150)",
    ],
  };
}

function useTheme() {
  const mq = typeof window !== "undefined"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : { matches: true };
  const [dark, setDark] = useState(mq.matches);
  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => setDark(e.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);
  return makeTheme(dark);
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 520);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth > 520);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isDesktop;
}

// ─── Components ────────────────────────────────────────────────────────────

function CardPill({ card, active, onClick, onRemove, t }) {
  const red = card && isRed(card.suit);
  const filled = !!card;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, height: "clamp(38px, 11vw, 44px)", borderRadius: 8, border: "none",
        // Filled = real card lying on felt (cream + Spectral). Empty = felt slot placeholder.
        background: filled ? t.cardFace : t.feltMid,
        outline: active ? `2px solid ${t.goldBright}` : `2px solid transparent`,
        outlineOffset: 1,
        cursor: "pointer", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: filled ? "0 2px 8px oklch(0% 0 0 / 0.35), 0 1px 2px oklch(0% 0 0 / 0.25)" : "none",
        transition: "outline 0.1s, box-shadow 0.15s",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {filled ? (
        <>
          <span style={{
            fontSize: 16, fontWeight: 700,
            color: red ? t.suitRed : t.textOnCard,
            fontFamily: t.fontCard, lineHeight: 1,
          }}>{card.rank}{card.suit}</span>
          <span
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{
              position: "absolute", top: 3, right: 5,
              fontSize: 11, color: "oklch(40% 0.020 80)", cursor: "pointer", lineHeight: 1,
            }}
          >✕</span>
        </>
      ) : (
        <span style={{ fontSize: 16, color: active ? t.goldBright : t.textDisabled }}>·</span>
      )}
    </button>
  );
}

function RankStrip({ selectedRank, usedKeys, onRankSelect, t }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(13, 1fr)",
      gap: 3, padding: "0 16px",
    }}>
      {RANKS.map(rank => {
        const allUsed = SUITS.every(s => usedKeys.has(rank + s));
        const isSelected = selectedRank === rank;
        return (
          <button
            key={rank}
            onClick={() => !allUsed && onRankSelect(isSelected ? null : rank)}
            style={{
              height: "clamp(38px, 11vw, 48px)", borderRadius: 8, border: "none", padding: 0,
              minWidth: 0, overflow: "hidden",
              background: isSelected ? t.accentYellow : allUsed ? t.surfaceSunken : t.surfaceRaised,
              // Selected: textPrimary on accentYellow — dark:#1c1c1e on #f5b800=6.0:1✓ light:#1c1c1e on #b8860b=4.6:1✓
              color: isSelected ? (t.dark ? "#1c1c1e" : "#ffffff") : allUsed ? t.textDisabled : t.textPrimary,
              fontSize: "clamp(11px, 3.5vw, 15px)", fontWeight: 800,
              cursor: allUsed ? "default" : "pointer",
              opacity: allUsed ? 0.4 : 1,
              transition: "background 0.12s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={e => { if (!allUsed && !isSelected) e.currentTarget.style.background = t.border; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = allUsed ? t.surfaceSunken : t.surfaceRaised; }}
          >
            {rank}
          </button>
        );
      })}
    </div>
  );
}

function SuitRow({ selectedRank, usedKeys, onPickSuit, t }) {
  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        {SUITS.map(suit => {
          const used = selectedRank && usedKeys.has(selectedRank + suit);
          const active = !!selectedRank && !used;
          const red = isRed(suit);
          // Active text contrast: dark redCard #ff6b6b on #2e1515 → 5.6:1✓; blueCard #74b9ff on #12233a → 7.1:1✓
          //                       light redCard #b91c1c on #fef2f2 → 5.9:1✓; blueCard #1e3a5f on #eff6ff → 10.1:1✓
          return (
            <button
              key={suit}
              onClick={() => active && onPickSuit(suit)}
              style={{
                height: "clamp(48px, 14vw, 56px)", borderRadius: 10, border: "none",
                background: active
                  ? (red ? t.redSuitBg : t.blueSuitBg)
                  : t.feltMid,
                color: used
                  ? t.textDisabled
                  // SuitRow is the one chrome exception to Suit Quarantine: the
                  // suit glyph IS the affordance, so it must read as a suit.
                  // Red suits keep their color; black suits use textPrimary
                  // (suit-dark is authored for cream card faces, too dark here).
                  : active
                    ? (red ? t.suitRed : t.textPrimary)
                    : t.textMuted,
                fontSize: 26,
                cursor: active ? "pointer" : "default",
                transition: "background 0.15s, color 0.15s",
                WebkitTapHighlightColor: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={e => { if (active) e.currentTarget.style.background = red ? t.redSuitHover : t.blueSuitHover; }}
              onMouseLeave={e => { if (active) e.currentTarget.style.background = red ? t.redSuitBg : t.blueSuitBg; }}
            >
              {suit}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScorePanel({ result, t }) {
  const { total, log } = result;
  // High scores get celebrated; low scores stay neutral (red would imply
  // the player did something wrong, but a low hand is often just the deal).
  const accent = total >= 24 ? t.goldBright
               : total >= 16 ? t.scorePositive
               : total >= 8  ? t.textPrimary
               : t.textSecondary;
  const label = total === 29 ? "🏆 Perfect 29!" : total === 0 ? "Zilch"
    : total >= 20 ? "Outstanding" : total >= 12 ? "Strong" : total >= 8 ? "Solid" : "Below average";

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <span style={{
          fontSize: 56, fontWeight: 700, lineHeight: 1, color: accent,
          fontFamily: t.fontMono, letterSpacing: "-0.02em",
        }}>{total}</span>
        {/* textSecondary on surfaceBg: dark #aeaeb2 on #1c1c1e=5.0:1✓ light #3a3a3c on #fff=13.4:1✓ */}
        <span style={{ fontSize: 14, color: t.textSecondary }}>{label}</span>
      </div>
      {/* Score breakdown rows — v2 layout. Reason on top, cards-that-scored as
          inline SF Mono sub-text, +N value right-aligned in SF Mono. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {log.map((item, i) => {
          const uniqueCards = [...new Map(item.cards.map(c => [cardKey(c), c])).values()];
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: 8,
              background: t.feltMid, border: `1px solid ${t.feltRule}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: t.textSecondary, lineHeight: 1.3,
                }}>{item.reason}</div>
                {uniqueCards.length > 0 && (
                  <div style={{
                    display: "flex", gap: 6, flexWrap: "wrap",
                    marginTop: 3, lineHeight: 1,
                  }}>
                    {uniqueCards.map((c, ci) => (
                      <span key={cardKey(c) + "-" + ci} style={{
                        fontFamily: t.fontMono, fontSize: 11, fontWeight: 500,
                        color: isRed(c.suit) ? t.suitRed : t.textMuted,
                        whiteSpace: "nowrap",
                      }}>{c.rank}{c.suit}</span>
                    ))}
                  </div>
                )}
              </div>
              <span style={{
                fontFamily: t.fontMono,
                fontSize: 16, fontWeight: 600,
                color: t.scorePositive, lineHeight: 1, flexShrink: 0,
              }}>+{item.pts}</span>
            </div>
          );
        })}
        {log.length === 0 && (
          <div style={{ color: t.textSecondary, fontSize: 13 }}>No scoring combinations</div>
        )}
      </div>
    </div>
  );
}

// ─── Navigation ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "scorer",  label: "Scorer",           icon: "🃏" },
  { id: "trainer", label: "Cribbage Trainer",  icon: "🎓" },
];

function NavDrawer({ open, onClose, view, onNavigate, t }) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 200ms",
          zIndex: 100,
        }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: 260,
        background: t.surfaceBg,
        borderRight: `1px solid ${t.border}`,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 200ms ease-out",
        zIndex: 101,
        display: "flex", flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        {/* Drawer header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: "calc(20px + env(safe-area-inset-top))",
          paddingBottom: 16, paddingLeft: 16, paddingRight: 16,
          borderBottom: `1px solid ${t.border}`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Menu</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: t.textSecondary, fontSize: 18, lineHeight: 1, padding: "2px 4px",
            WebkitTapHighlightColor: "transparent",
          }}>✕</button>
        </div>
        {/* Nav items — active state uses Marker Gold tint + accent text only.
            Per DESIGN.md "Don't" rule: no side-stripe borders. */}
        <div style={{ paddingTop: 8, paddingLeft: 8, paddingRight: 8 }}>
          {NAV_ITEMS.map(item => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "14px 12px",
                  background: active ? `${t.accentYellow}1f` : "transparent",
                  border: "none",
                  borderRadius: 10,
                  color: active ? t.accentYellow : t.textPrimary,
                  fontSize: 15, fontWeight: active ? 700 : 500,
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.12s",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function TrainerScreen({ t }) {
  return <TrainerScreenComponent t={t} />;
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function CribbageCalculator() {
  const t = useTheme();
  const isDesktop = useIsDesktop();
  const [view, setView] = useState("scorer");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [slots, setSlots] = useState(Array(5).fill(null));
  const [activeSlot, setActiveSlot] = useState(0);
  const [selectedRank, setSelectedRank] = useState(null);
  const [mode, setMode] = useState("hand");

  const usedKeys = new Set(slots.filter(Boolean).map(cardKey));
  const hand4 = slots.slice(1).filter(Boolean);
  const result = hand4.length === 4 ? scoreHand(hand4, slots[0], mode === "crib") : null;
  const canPick = activeSlot !== null;

  function pickSlot(i) { setActiveSlot(i); setSelectedRank(null); }
  function pickRank(rank) { setSelectedRank(rank); }
  function pickSuit(suit) {
    if (activeSlot === null || !selectedRank) return;
    const newSlots = [...slots];
    newSlots[activeSlot] = { rank: selectedRank, suit };
    setSlots(newSlots);
    setSelectedRank(null);
    const next = newSlots.findIndex((s, i) => i !== activeSlot && s === null);
    setActiveSlot(next === -1 ? null : next);
  }
  function removeCard(i) {
    const s = [...slots]; s[i] = null; setSlots(s);
    setActiveSlot(i); setSelectedRank(null);
  }
  function randomize() {
    const deck = SUITS.flatMap(suit => RANKS.map(rank => ({ rank, suit })));
    setSlots([...deck].sort(() => Math.random() - 0.5).slice(0, 5));
    setActiveSlot(null); setSelectedRank(null);
  }
  function clear() { setSlots(Array(5).fill(null)); setActiveSlot(0); setSelectedRank(null); }

  return (
    <div style={{
      // Mobile: exact viewport height so TrainerScreen's internal flex/overflow layout works
      // Desktop: min-height for vertical centering with padding
      height: isDesktop ? undefined : "100dvh",
      minHeight: isDesktop ? "100vh" : undefined,
      background: t.pageBg,
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      padding: isDesktop ? "48px 20px 64px" : 0,
    }}>
    <div style={{
      width: "100%", maxWidth: 480,
      display: "flex", flexDirection: "column",
      // Mobile: flex:1 fills the exact height of the outer div (no overflow, no growth)
      // Desktop: auto height, grows with content
      flex: isDesktop ? undefined : 1,
      minHeight: isDesktop ? "auto" : undefined,
      borderRadius: isDesktop ? 18 : 0,
      overflow: "hidden",
      boxShadow: isDesktop ? `0 8px 48px rgba(0,0,0,0.45), 0 1px 0 ${t.border}` : "none",
      border: isDesktop ? `1px solid ${t.border}` : "none",
      background: t.surfaceBg,
    }}>

      {/* Header */}
      <div style={{
        paddingTop: isDesktop ? 18 : "calc(18px + env(safe-area-inset-top))",
        paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
        background: t.surfaceBg,
        borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: t.textPrimary, fontSize: 20, lineHeight: 1,
            padding: "2px 4px", flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
          }}
          aria-label="Open menu"
        >☰</button>
        <h1 style={{
          margin: 0, fontSize: 20, fontWeight: 800, color: t.textPrimary,
          fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.02em",
        }}>{view === "scorer" ? "Cribbage Scorer" : "Cribbage Trainer"}</h1>
      </div>

      {view === "trainer" && <TrainerScreen t={t} />}

      {view === "scorer" && <>
      {/* Slot strip */}
      <div style={{
        background: t.surfaceBg, padding: "12px 16px",
        borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Hand</span>
            <div style={{ display: "flex", gap: 5 }}>
              {[1,2,3,4].map(i => (
                <CardPill key={i} card={slots[i]} active={activeSlot === i} onClick={() => pickSlot(i)} onRemove={() => removeCard(i)} t={t} />
              ))}
            </div>
          </div>
          <div style={{ width: 1, background: t.border, margin: "14px 0 0", alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 52, flexShrink: 0 }}>
            {/* textMuted label — decorative only, not relied on for info */}
            <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", textAlign: "center" }}>Cut</span>
            <CardPill card={slots[0]} active={activeSlot === 0} onClick={() => pickSlot(0)} onRemove={() => removeCard(0)} t={t} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={randomize} style={{
            flex: 1, padding: "8px 0", borderRadius: 9,
            background: t.surfaceRaised, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600, color: t.textPrimary,
          }}>🎲 Random hand</button>
          <button onClick={clear} style={{
            padding: "8px 18px", borderRadius: 9,
            background: "transparent", border: `1px solid ${t.border}`,
            cursor: "pointer", fontSize: 13,
            color: t.textSecondary,
          }}>Clear</button>
        </div>

        {/* Hand / Crib toggle */}
        <div style={{ display: "flex", gap: 0, marginTop: 10, borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}` }}>
          {["hand", "crib"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 700,
              background: mode === m ? t.accentYellow : t.surfaceRaised,
              color: mode === m ? (t.dark ? "#1c1c1e" : "#1c1c1e") : t.textSecondary,
              border: "none", cursor: "pointer", textTransform: "capitalize",
              transition: "background 0.15s, color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}>{m === "hand" ? "Hand" : "Crib"}</button>
          ))}
        </div>
      </div>

      {/* Picker */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: "14px 0 12px" }}>
        <div style={{ paddingBottom: 12 }}>
          <RankStrip selectedRank={selectedRank} usedKeys={usedKeys} onRankSelect={canPick ? pickRank : () => {}} t={t} />
        </div>
        <SuitRow selectedRank={selectedRank} usedKeys={usedKeys} onPickSuit={pickSuit} t={t} />
      </div>

      {/* Score */}
      {result ? (
        <div style={{ background: t.surfaceBg, borderTop: `1px solid ${t.border}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
          <ScorePanel result={result} t={t} />
        </div>
      ) : (
        <div style={{ padding: "16px 16px", paddingBottom: "calc(32px + env(safe-area-inset-bottom))", textAlign: "center", color: t.textSecondary, fontSize: 13 }}>
          {hand4.length === 0 ? "Pick 4 hand cards to score"
            : `${4 - hand4.length} more card${4 - hand4.length > 1 ? "s" : ""} needed`}
        </div>
      )}
      </>}

    </div>
    <NavDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      view={view}
      onNavigate={setView}
      t={t}
    />
    </div>
  );
}
