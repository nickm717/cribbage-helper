import { useState } from "react";
import { cardKey, isRed } from "./engine.js";

function MiniCard({ card, t }) {
  const red = isRed(card.suit);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 12, fontWeight: 700,
      color: red ? t.suitRed : t.textOnCard,
      background: t.cardFace, borderRadius: 4, padding: "3px 7px",
      fontFamily: t.fontCard, lineHeight: 1,
      border: "1px solid oklch(0% 0 0 / 0.08)",
    }}>{card.rank}{card.suit}</span>
  );
}

export function RankBadge({ rank, t }) {
  const bg = rank >= 90 ? "oklch(30% 0.060 150 / 0.5)"
    : rank >= 70 ? "oklch(30% 0.060 78 / 0.5)"
    : rank >= 50 ? t.feltLift
    : "oklch(28% 0.060 25 / 0.5)";
  const color = rank >= 90 ? t.scorePositive
    : rank >= 70 ? t.goldBright
    : rank >= 50 ? t.textSecondary
    : t.scoreMiss;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 36, height: 22, borderRadius: 11,
      background: bg, color, fontFamily: t.fontMono,
      fontSize: 11, fontWeight: 700, letterSpacing: "-0.01em",
      flexShrink: 0,
    }}>{rank}</span>
  );
}

export function DiscardOptionRow({ option, isPlayerDiscard, isOptimal, t }) {
  const border = isOptimal
    ? `1px solid ${t.goldDim}`
    : isPlayerDiscard
    ? `1px solid ${t.textSecondary}`
    : `1px solid ${t.feltRule}`;
  const bg = isOptimal ? `linear-gradient(135deg, ${t.feltMid}, oklch(24% 0.045 90 / 0.6))` : t.feltMid;

  return (
    <div style={{
      background: bg, border, borderRadius: 8,
      padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
          {option.keep.map(c => <MiniCard key={cardKey(c)} card={c} t={t} />)}
        </div>
        <RankBadge rank={option.rank} t={t} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>crib</span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", opacity: 0.6 }}>
          {option.discard.map(c => <MiniCard key={cardKey(c)} card={c} t={t} />)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
        {[
          { label: "MIN", value: option.handMin },
          { label: "AVG", value: option.handAvg.toFixed(1) },
          { label: "MAX", value: option.handMax },
          { label: "CRIB", value: option.cribAvg.toFixed(1) },
          { label: "NET", value: option.combinedEV.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: t.surfaceSunken, borderRadius: 6, padding: "5px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 8, color: t.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: label === "NET" ? t.goldBright : t.textPrimary, fontFamily: t.fontMono, letterSpacing: "-0.01em" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Collapsible variant — used in Trainer reveal phase
export function DiscardOptionsTable({ allOptions, discarded, optKeep, t }) {
  const [expanded, setExpanded] = useState(false);
  if (!allOptions.length) return null;

  const playerDiscardKey = discarded.map(cardKey).sort().join(",");
  const optKeepKey = optKeep ? optKeep.map(cardKey).sort().join(",") : null;

  return (
    <div style={{ marginTop: 0 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: t.feltMid, border: `1px solid ${t.feltRule}`, borderRadius: expanded ? "8px 8px 0 0" : 8,
          padding: "10px 14px", cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          fontFamily: t.fontUi,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>
            All Discard Options {expanded ? "▴" : "▾"}
          </span>
          <span style={{ fontSize: 10, color: t.textMuted, letterSpacing: "0.04em" }}>
            Estimates for random opponent discards &amp; cut
          </span>
        </div>
        <span style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>15 options</span>
      </button>
      {expanded && (
        <DiscardOptionsList
          allOptions={allOptions}
          playerDiscardKey={playerDiscardKey}
          optKeepKey={optKeepKey}
          t={t}
        />
      )}
    </div>
  );
}

// Always-expanded variant — used in Scorer discard mode
export function DiscardOptionsExpanded({ allOptions, t }) {
  if (!allOptions.length) return null;
  return (
    <DiscardOptionsList
      allOptions={allOptions}
      playerDiscardKey={null}
      optKeepKey={allOptions[0]?.keep.map(cardKey).sort().join(",")}
      t={t}
    />
  );
}

function DiscardOptionsList({ allOptions, playerDiscardKey, optKeepKey, t }) {
  return (
    <div style={{
      background: t.feltDeep, border: `1px solid ${t.feltRule}`, borderTop: "none",
      borderRadius: "0 0 8px 8px", padding: "8px 8px 10px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      {allOptions.map((opt, i) => {
        const optDiscardKey = opt.discard.map(cardKey).sort().join(",");
        const isPlayerDiscard = playerDiscardKey !== null && optDiscardKey === playerDiscardKey;
        const optKeepKeys = opt.keep.map(cardKey).sort().join(",");
        const isOptimal = optKeepKey !== null && optKeepKeys === optKeepKey;
        return (
          <DiscardOptionRow
            key={i}
            option={opt}
            isPlayerDiscard={isPlayerDiscard}
            isOptimal={isOptimal}
            t={t}
          />
        );
      })}
    </div>
  );
}
