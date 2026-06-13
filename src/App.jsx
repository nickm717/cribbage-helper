import { useState, useEffect } from "react";
import TrainerScreenComponent from "./TrainerScreen.jsx";
import HistoryScreen from "./HistoryScreen.jsx";
import { isRed, cardKey, scoreHand, RANKS, SUITS } from "./engine.js";
import { useTheme } from "./theme.js";
import { cardLabel } from "./format.js";


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
  // A container holds the main pick button and, when filled, a sibling remove
  // button. Buttons are never nested (invalid HTML); the remove control sits on
  // top as its own focusable, labeled control.
  return (
    <div style={{ flex: 1, position: "relative", display: "flex" }}>
      <button
        onClick={onClick}
        aria-label={filled ? `${cardLabel(card)}, slot filled` : "Empty slot, tap to fill"}
        aria-pressed={active}
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
          <span style={{
            fontSize: 16, fontWeight: 700,
            color: red ? t.suitRed : t.textOnCard,
            fontFamily: t.fontCard, lineHeight: 1,
          }}>{card.rank}{card.suit}</span>
        ) : (
          <span style={{ fontSize: 16, color: active ? t.goldBright : t.textDisabled }}>·</span>
        )}
      </button>
      {filled && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remove ${cardLabel(card)}`}
          style={{
            position: "absolute", top: 0, right: 0,
            width: 24, height: 24, padding: 0, border: "none",
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
            color: "oklch(40% 0.020 80)", fontSize: 11, lineHeight: 1,
            WebkitTapHighlightColor: "transparent",
          }}
        ><span style={{ padding: "3px 5px" }} aria-hidden="true">✕</span></button>
      )}
    </div>
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
              background: isSelected ? t.goldBright : allUsed ? t.feltDeep : t.feltMid,
              color: isSelected ? t.textOnGold : allUsed ? t.textDisabled : t.textPrimary,
              fontSize: "clamp(11px, 3.5vw, 15px)", fontWeight: 800,
              cursor: allUsed ? "default" : "pointer",
              opacity: allUsed ? 0.4 : 1,
              transition: "background 0.12s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={e => { if (!allUsed && !isSelected) e.currentTarget.style.background = t.feltRule; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = allUsed ? t.feltDeep : t.feltMid; }}
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
  { id: "trainer",  label: "Trainer",  subtitle: "Practice discards & scoring",    icon: "🎓" },
  { id: "scorer",   label: "Scorer",   subtitle: "Score any hand manually",         icon: "🃏" },
  { id: "history",  label: "History",  subtitle: "Past sessions & efficiency",      icon: "📋" },
  { id: "settings", label: "Settings", subtitle: "Rules variants & preferences",    icon: "⚙️" },
];

function TopBar({ view, dropdownOpen, onToggleDropdown, onThemeToggle, isDesktop, isDark, t }) {
  const current = NAV_ITEMS.find(n => n.id === view);
  return (
    <div style={{
      display: "flex", alignItems: "center",
      paddingTop: isDesktop ? 18 : "calc(18px + env(safe-area-inset-top))",
      paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
      background: t.feltBase,
    }}>
      <span style={{
        fontSize: 20, fontWeight: 800, color: t.textPrimary,
        fontFamily: t.fontUi,
        letterSpacing: "-0.02em", lineHeight: 1, flexShrink: 0,
      }}>121</span>

      <div style={{ width: 1, height: 18, background: t.feltRule, margin: "0 12px", flexShrink: 0 }} />

      <button
        onClick={onToggleDropdown}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: t.feltMid, border: "none",
          borderRadius: 8, padding: "6px 10px",
          cursor: "pointer", flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{
          fontSize: 15, fontWeight: 700, color: t.textPrimary,
          fontFamily: t.fontUi, letterSpacing: "-0.01em",
        }}>{current?.label}</span>
        <span style={{
          fontSize: 10, color: t.textSecondary, lineHeight: 1,
          display: "inline-block",
          transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 200ms ease-out",
        }}>▾</span>
      </button>

      <div style={{ flex: 1 }} />

      <button
        onClick={onThemeToggle}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: t.textSecondary, fontSize: 18,
          minWidth: 44, minHeight: 44,
          WebkitTapHighlightColor: "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          lineHeight: 1,
        }}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >{isDark ? "☀" : "☾"}</button>
    </div>
  );
}

function SectionDropdown({ view, onNavigate, t }) {
  return (
    <div style={{ background: t.feltBase }}>
      {NAV_ITEMS.map((item, idx) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              width: "100%", padding: "14px 16px",
              background: active ? t.goldGlow : "transparent",
              border: "none",
              borderBottom: idx < NAV_ITEMS.length - 1 ? `1px solid ${t.feltRule}` : "none",
              cursor: "pointer", textAlign: "left",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: t.feltMid,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 700, lineHeight: 1.2,
                color: active ? t.goldBright : t.textPrimary,
                fontFamily: t.fontUi, letterSpacing: "-0.01em",
              }}>{item.label}</div>
              <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 2, lineHeight: 1.3 }}>
                {item.subtitle}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


function SettingsScreen({ t }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 32, gap: 10, background: t.feltBase,
    }}>
      <div style={{ fontSize: 40 }}>⚙️</div>
      <div style={{
        fontSize: 20, fontWeight: 800, color: t.textPrimary,
        fontFamily: t.fontUi, letterSpacing: "-0.01em",
      }}>Settings</div>
      <div style={{ fontSize: 13, color: t.textSecondary, textAlign: "center", maxWidth: 260, lineHeight: 1.5 }}>
        Rules variants and preferences coming soon.
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function CribbageCalculator() {
  const [t, toggleTheme, isDark] = useTheme();
  const isDesktop = useIsDesktop();
  const [view, setView] = useState("trainer");
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
      height: isDesktop ? undefined : "100dvh",
      minHeight: isDesktop ? "100vh" : undefined,
      background: t.feltDeep,
      fontFamily: t.fontUi,
      display: "flex", flexDirection: "column",
      alignItems: "center",
      padding: isDesktop ? "48px 20px 64px" : 0,
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", flexDirection: "column",
        flex: isDesktop ? undefined : 1,
        minHeight: isDesktop ? "auto" : undefined,
        borderRadius: isDesktop ? 18 : 0,
        overflow: "hidden",
        boxShadow: isDesktop ? `0 8px 48px rgba(0,0,0,0.45), 0 1px 0 ${t.feltRule}` : "none",
        border: isDesktop ? `1px solid ${t.feltRule}` : "none",
        background: t.feltBase,
      }}>

        {/* TopBar */}
        <TopBar
          view={view}
          dropdownOpen={dropdownOpen}
          onToggleDropdown={() => setDropdownOpen(o => !o)}
          onThemeToggle={toggleTheme}
          isDesktop={isDesktop}
          isDark={isDark}
          t={t}
        />

        {/* Topbar rule — always visible, separates header from page content */}
        <div style={{ height: 1, background: t.feltRule, flexShrink: 0 }} />

        {/* Content area: flex 1, relative so dropdown can overlay it */}
        <div style={{
          flex: 1, position: "relative",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* Section dropdown overlay */}
          {dropdownOpen && (
            <>
              {/* Scrim — dims content, click to close */}
              <div
                onClick={() => setDropdownOpen(false)}
                style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.5)",
                  zIndex: 9,
                }}
              />
              {/* Dropdown panel */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                zIndex: 10,
                background: t.feltBase,
                borderBottom: `1px solid ${t.feltRule}`,
              }}>
                <SectionDropdown
                  view={view}
                  onNavigate={(id) => { setView(id); setDropdownOpen(false); }}
                  t={t}
                />
              </div>
            </>
          )}

          {/* Page content */}
          {view === "trainer" && <TrainerScreenComponent t={t} />}

          {view === "scorer" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
              {/* Slot strip */}
              <div style={{
                background: t.feltBase, padding: "12px 16px",
                borderBottom: `1px solid ${t.feltRule}`, flexShrink: 0,
              }}>
                <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 52, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: 1, textTransform: "uppercase", textAlign: "center" }}>Cut</span>
                    <CardPill card={slots[0]} active={activeSlot === 0} onClick={() => pickSlot(0)} onRemove={() => removeCard(0)} t={t} />
                  </div>
                  <div style={{ width: 1, background: t.feltRule, margin: "14px 0 0", alignSelf: "stretch" }} />
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
                    background: t.feltMid, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: t.textPrimary,
                  }}>🎲 Random hand</button>
                  <button onClick={clear} style={{
                    padding: "8px 18px", borderRadius: 9,
                    background: "transparent", border: `1px solid ${t.feltRule}`,
                    cursor: "pointer", fontSize: 13, color: t.textSecondary,
                  }}>Clear</button>
                </div>
                <div style={{ display: "flex", gap: 0, marginTop: 10, borderRadius: 10, overflow: "hidden", border: `1px solid ${t.feltRule}` }}>
                  {["hand", "crib"].map(m => (
                    <button key={m} onClick={() => setMode(m)} style={{
                      flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 700,
                      background: mode === m ? t.goldBright : t.feltMid,
                      color: mode === m ? t.textOnGold : t.textSecondary,
                      border: "none", cursor: "pointer", textTransform: "capitalize",
                      transition: "background 0.15s, color 0.15s",
                      WebkitTapHighlightColor: "transparent",
                    }}>{m === "hand" ? "Hand" : "Crib"}</button>
                  ))}
                </div>
              </div>

              {/* Picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: "14px 0 12px", flexShrink: 0 }}>
                <div style={{ paddingBottom: 12 }}>
                  <RankStrip selectedRank={selectedRank} usedKeys={usedKeys} onRankSelect={canPick ? pickRank : () => {}} t={t} />
                </div>
                <SuitRow selectedRank={selectedRank} usedKeys={usedKeys} onPickSuit={pickSuit} t={t} />
              </div>

              {/* Score */}
              {result ? (
                <div style={{ background: t.feltBase, borderTop: `1px solid ${t.feltRule}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
                  <ScorePanel result={result} t={t} />
                </div>
              ) : (
                <div style={{ padding: "16px 16px", paddingBottom: "calc(32px + env(safe-area-inset-bottom))", textAlign: "center", color: t.textSecondary, fontSize: 13 }}>
                  {hand4.length === 0 ? "Pick 4 hand cards to score"
                    : `${4 - hand4.length} more card${4 - hand4.length > 1 ? "s" : ""} needed`}
                </div>
              )}
            </div>
          )}

          {view === "history"  && <HistoryScreen  t={t} />}
          {view === "settings" && <SettingsScreen t={t} />}

        </div>
      </div>
    </div>
  );
}
