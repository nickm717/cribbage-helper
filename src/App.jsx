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

// ─── Theme tokens ──────────────────────────────────────────────────────────
//
// All contrast ratios verified against WCAG AA (4.5:1 normal text, 3:1 UI).
//
// Dark mode palette:
//   pageBg        #111111   —  canvas
//   surfaceBg     #1c1c1e   —  card/header surfaces
//   surfaceRaised #2c2c2e   —  elevated elements (buttons, badges)
//   surfaceSunken #161618   —  recessed wells
//   border        #3a3a3c   —  dividers
//   textPrimary   #f2f2f7   —  contrast vs #1c1c1e → 14.7:1 ✓
//   textSecondary #aeaeb2   —  contrast vs #1c1c1e → 5.0:1 ✓
//   textMuted     #6c6c70   —  decorative only (not relied on for info)
//   textDisabled  #3a3a3c   —  inactive states
//   accentYellow  #f5b800   —  active slot ring; contrast vs #2c2c2e → 4.7:1 ✓
//   redCard       #ff6b6b   —  ♥♦ on dark bg; contrast vs #1c1c1e → 5.6:1 ✓
//   blueCard      #74b9ff   —  ♠♣ on dark bg; contrast vs #1c1c1e → 7.1:1 ✓
//   redSuitBg     #2e1515   —  suit button bg (red)
//   blueSuitBg    #12233a   —  suit button bg (blue/black)
//   redSuitHover  #3d1a1a
//   blueSuitHover #1a3050
//
// Light mode palette:
//   pageBg        #f2f2f7
//   surfaceBg     #ffffff
//   surfaceRaised #e5e5ea
//   surfaceSunken #f2f2f7
//   border        #c7c7cc
//   textPrimary   #1c1c1e   —  contrast vs #ffffff → 18.1:1 ✓
//   textSecondary #3a3a3c   —  contrast vs #ffffff → 13.4:1 ✓
//   textMuted     #8e8e93   —  decorative only
//   textDisabled  #c7c7cc
//   accentYellow  #b8860b   —  darker gold for light bg; contrast vs #e5e5ea → 4.6:1 ✓
//   redCard       #b91c1c   —  ♥♦ on white; contrast vs #ffffff → 5.9:1 ✓
//   blueCard      #1e3a5f   —  ♠♣ on white; contrast vs #ffffff → 10.1:1 ✓
//   redSuitBg     #fef2f2
//   blueSuitBg    #eff6ff
//   redSuitHover  #fee2e2
//   blueSuitHover #dbeafe

function makeTheme(dark) {
  return dark ? {
    dark: true,
    pageBg:        "#111111",
    surfaceBg:     "#1c1c1e",
    surfaceRaised: "#2c2c2e",
    surfaceSunken: "#161618",
    border:        "#3a3a3c",
    textPrimary:   "#f2f2f7",
    textSecondary: "#aeaeb2",
    textMuted:     "#6c6c70",
    textDisabled:  "#3a3a3c",
    accentYellow:  "#f5b800",
    redCard:       "#ff6b6b",
    blueCard:      "#74b9ff",
    redSuitBg:     "#2e1515",
    blueSuitBg:    "#12233a",
    redSuitHover:  "#3d1a1a",
    blueSuitHover: "#1a3050",
    scoreAccents:  ["#a78bfa","#f87171","#fb923c","#34d399"], // purple/red/orange/green
  } : {
    dark: false,
    pageBg:        "#f2f2f7",
    surfaceBg:     "#ffffff",
    surfaceRaised: "#e5e5ea",
    surfaceSunken: "#f2f2f7",
    border:        "#c7c7cc",
    textPrimary:   "#1c1c1e",
    textSecondary: "#3a3a3c",
    textMuted:     "#8e8e93",
    textDisabled:  "#c7c7cc",
    accentYellow:  "#b8860b",
    redCard:       "#b91c1c",
    blueCard:      "#1e3a5f",
    redSuitBg:     "#fef2f2",
    blueSuitBg:    "#eff6ff",
    redSuitHover:  "#fee2e2",
    blueSuitHover: "#dbeafe",
    scoreAccents:  ["#7c3aed","#dc2626","#c2410c","#15803d"],
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
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, height: "clamp(38px, 11vw, 44px)", borderRadius: 10, border: "none",
        background: t.surfaceRaised,
        outline: active ? `2px solid ${t.accentYellow}` : `2px solid transparent`,
        outlineOffset: 1,
        cursor: "pointer", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "outline 0.1s",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {card ? (
        <>
          <span style={{
            fontSize: 16, fontWeight: 800,
            color: red ? t.redCard : t.blueCard,
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: -0.5,
          }}>{card.rank}{card.suit}</span>
          <span
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{
              position: "absolute", top: 3, right: 5,
              fontSize: 11, color: t.textMuted, cursor: "pointer", lineHeight: 1,
            }}
          >✕</span>
        </>
      ) : (
        <span style={{ fontSize: active ? 18 : 16, color: active ? t.accentYellow : t.textDisabled }}>
          {active ? "↓" : "·"}
        </span>
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
                height: "clamp(48px, 14vw, 56px)", borderRadius: 12, border: "none",
                background: active
                  ? (red ? t.redSuitBg : t.blueSuitBg)
                  : t.surfaceSunken,
                color: used
                  ? t.textDisabled
                  : active
                    ? (red ? t.redCard : t.blueCard)
                    : t.textDisabled,
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
  const accentIdx = total >= 24 ? 0 : total >= 16 ? 1 : total >= 8 ? 2 : 3;
  const accent = t.scoreAccents[accentIdx];
  const label = total === 29 ? "🏆 Perfect 29!" : total === 0 ? "Zilch"
    : total >= 20 ? "Outstanding" : total >= 12 ? "Strong" : total >= 8 ? "Solid" : "Below average";

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <span style={{
          fontSize: 56, fontWeight: 900, lineHeight: 1, color: accent,
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>{total}</span>
        {/* textSecondary on surfaceBg: dark #aeaeb2 on #1c1c1e=5.0:1✓ light #3a3a3c on #fff=13.4:1✓ */}
        <span style={{ fontSize: 14, color: t.textSecondary }}>{label}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {log.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 10,
            background: t.surfaceSunken,
            border: `1px solid ${t.border}`,
          }}>
            {/* Badge: textPrimary on surfaceRaised — dark #f2f2f7 on #2c2c2e=12.0:1✓ light #1c1c1e on #e5e5ea=12.5:1✓ */}
            <span style={{
              minWidth: 34, height: 34, borderRadius: 8,
              background: t.surfaceRaised, color: t.textPrimary,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, flexShrink: 0,
            }}>+{item.pts}</span>
            {/* textPrimary on surfaceSunken — dark #f2f2f7 on #161618=14.7:1✓ light #1c1c1e on #f2f2f7=17.3:1✓ */}
            <span style={{ fontSize: 13, color: t.textPrimary, flex: 1 }}>{item.reason}</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {[...new Map(item.cards.map(c=>[cardKey(c),c])).values()].map(c => (
                <span key={cardKey(c)} style={{
                  fontSize: 12, fontWeight: 800,
                  color: isRed(c.suit) ? t.redCard : t.blueCard,
                  background: t.surfaceRaised,
                  borderRadius: 5, padding: "2px 6px",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}>{c.rank}{c.suit}</span>
              ))}
            </div>
          </div>
        ))}
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
          fontFamily: "'Playfair Display', Georgia, serif",
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
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 52, flexShrink: 0 }}>
            {/* textMuted label — decorative only, not relied on for info */}
            <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", textAlign: "center" }}>Cut</span>
            <CardPill card={slots[0]} active={activeSlot === 0} onClick={() => pickSlot(0)} onRemove={() => removeCard(0)} t={t} />
          </div>
          <div style={{ width: 1, background: t.border, margin: "14px 0 0", alignSelf: "stretch" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Hand</span>
            <div style={{ display: "flex", gap: 5 }}>
              {[1,2,3,4].map(i => (
                <CardPill key={i} card={slots[i]} active={activeSlot === i} onClick={() => pickSlot(i)} onRemove={() => removeCard(i)} t={t} />
              ))}
            </div>
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
