import { useState, useEffect } from "react";
import { cardValue, rankIdx, isRed, cardKey, fullDeck, combos, scoreFifteens, scorePairs, scoreRuns, scoreFlush, scoreNobs, scoreNibs, scoreHand, evHand, evCrib, bestKeep, analyzeHand } from "./engine.js";
import { DiscardOptionsTable } from "./DiscardAnalysis.jsx";

// ─── History persistence ─────────────────────────────────────────────────────

function saveHandToHistory(grade, yourPts, optPts) {
  let sessions;
  try {
    sessions = JSON.parse(localStorage.getItem("cribbage_history") || "[]");
  } catch {
    sessions = [];
  }
  const now = new Date();
  const today = now.toLocaleDateString("sv");
  const last = sessions[sessions.length - 1];
  const isActive = last && last.date === today
    && (now.getTime() - new Date(last.id).getTime()) < 4 * 60 * 60 * 1000;

  if (isActive) {
    last.hands += 1;
    last.yourPts += yourPts;
    last.optPts += optPts;
    last.efficiency = last.optPts > 0 ? Math.round(last.yourPts / last.optPts * 100) : 100;
    last.grades[grade] = (last.grades[grade] || 0) + 1;
  } else {
    const entry = {
      id: now.toISOString(),
      date: today,
      hands: 1,
      yourPts,
      optPts,
      efficiency: optPts > 0 ? Math.round(yourPts / optPts * 100) : 100,
      grades: { Optimal: 0, Close: 0, Suboptimal: 0, [grade]: 1 },
    };
    if (sessions.length >= 100) sessions.shift();
    sessions.push(entry);
  }
  localStorage.setItem("cribbage_history", JSON.stringify(sessions));
}

// ─── Card Components ─────────────────────────────────────────────────────────

// PlayingCard: cream Card Face surface with Spectral serif rank glyphs.
// Two-layer shadow per DESIGN.md Two-Layer Shadow Rule. CardFan handles
// the lift / rotate hover transform; this component only paints the face.
function PlayingCard({ card, selected, dimmed, t }) {
  const red = card && isRed(card.suit);
  const ink = red ? t.suitRed : t.suitDark;
  const restShadow = "0 2px 8px oklch(0% 0 0 / 0.35), 0 1px 2px oklch(0% 0 0 / 0.25)";
  const selectedShadow = `0 0 0 2px ${t.goldBright}, 0 6px 20px oklch(0% 0 0 / 0.45)`;
  return (
    <div style={{
      width: 54, height: 78, borderRadius: 6, flexShrink: 0,
      background: t.cardFace,
      border: selected ? `2px solid ${t.goldBright}` : "2px solid oklch(0% 0 0 / 0.08)",
      boxShadow: selected ? selectedShadow : restShadow,
      opacity: dimmed ? 0.35 : 1,
      transition: "opacity 150ms cubic-bezier(0.22, 0.8, 0.36, 1), border-color 150ms cubic-bezier(0.22, 0.8, 0.36, 1), box-shadow 150ms cubic-bezier(0.22, 0.8, 0.36, 1)",
      userSelect: "none", WebkitUserSelect: "none",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top-left corner — Spectral rank + suit */}
      <div style={{ position: "absolute", top: 3, left: 5, lineHeight: 1, textAlign: "left" }}>
        <div style={{
          fontSize: card?.rank === "10" ? 13 : 15,
          fontWeight: 700, color: ink,
          fontFamily: t.fontCard, lineHeight: 1,
        }}>{card?.rank}</div>
        <div style={{ fontSize: 11, color: ink, fontFamily: t.fontCard, lineHeight: 1.1, marginTop: 1 }}>{card?.suit}</div>
      </div>
      {/* Center suit glyph — full-color focal point. Sits prominently at the
          card center like the pip on a real playing card. */}
      <span style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: 30, color: ink, opacity: 1,
        lineHeight: 1, pointerEvents: "none",
      }}>{card?.suit}</span>
      {/* Bottom-right corner — rotated 180° per real-deck convention */}
      <div style={{
        position: "absolute", bottom: 3, right: 5, lineHeight: 1,
        textAlign: "left", transform: "rotate(180deg)",
      }}>
        <div style={{
          fontSize: card?.rank === "10" ? 13 : 15,
          fontWeight: 700, color: ink,
          fontFamily: t.fontCard, lineHeight: 1,
        }}>{card?.rank}</div>
        <div style={{ fontSize: 11, color: ink, fontFamily: t.fontCard, lineHeight: 1.1, marginTop: 1 }}>{card?.suit}</div>
      </div>
    </div>
  );
}

// CardFan: flat row of cards with tap-to-select. Selected cards lift -10px
// per DESIGN.md card spec. Sized to fit 6 cards on mobile (~375px): 6 × 54 + 5 × 4 = 344px.
function CardFan({ cards, selected = [], onSelect, dimOthers = false, t }) {
  const LIFT = 12; // a touch above spec's 10 for thumb clarity on mobile
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
              transition: "transform 200ms cubic-bezier(0.22, 0.8, 0.36, 1)",
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

// MiniCard: chip variant. Used for "kept cards" and cut-card displays where
// the cards should read as discrete objects with their own surface.
// Black suits use textOnCard (deep value designed for the cream Card Face);
// textPrimary would be invisible since it's the light-on-dark UI color.
function MiniCard({ card, t }) {
  const red = isRed(card.suit);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 12, fontWeight: 700,
      color: red ? t.suitRed : t.textOnCard,
      background: t.cardFace, borderRadius: 4, padding: "3px 7px",
      fontFamily: t.fontCard, lineHeight: 1,
      border: `1px solid oklch(0% 0 0 / 0.08)`,
    }}>{card.rank}{card.suit}</span>
  );
}

// MiniCardInline: typographic variant. Used in score-row sub-text where the
// cards are evidence of what scored, not separate objects. Renders as plain
// inline glyphs in suit color, no chip, no border.
function MiniCardInline({ card, t }) {
  const red = isRed(card.suit);
  return (
    <span style={{
      fontFamily: t.fontMono,
      fontSize: 11,
      fontWeight: 500,
      color: red ? t.suitRed : t.textMuted,
      whiteSpace: "nowrap",
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
        fontFamily: t.fontMono,
        fontSize: 32, fontWeight: 700, lineHeight: 1,
        color: hasData ? tier : t.textMuted,
        letterSpacing: "-0.02em",
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
      flex: 1, padding: "14px 0", borderRadius: 8, border: "none",
      background: disabled ? t.feltMid : t.goldBright,
      color: disabled ? t.textDisabled : t.textOnGold,
      fontSize: 15, fontWeight: 600,
      letterSpacing: "-0.01em",
      cursor: disabled ? "default" : "pointer",
      // CTA Glow per DESIGN.md: soft amber halo when active
      boxShadow: disabled ? "none" : `0 2px 8px ${t.goldGlow}`,
      transition: "background 120ms cubic-bezier(0.16, 0.8, 0.44, 1), box-shadow 120ms cubic-bezier(0.16, 0.8, 0.44, 1)",
      WebkitTapHighlightColor: "transparent",
      fontFamily: t.fontUi,
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
      <div style={{ fontSize: 18, fontWeight: 600, color: t.textPrimary, fontFamily: t.fontMono, letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  );
}

// ScoreLogRow: v2 layout. Reason text on top, the cards that scored as inline
// sub-text below, +N value right-aligned in SF Mono. The sub-line turns a
// count into a teaching moment by showing exactly which cards combined.
function ScoreLogRow({ item, t, accentGold = false }) {
  const uniqueCards = [...new Map(item.cards.map(c => [cardKey(c), c])).values()];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", marginBottom: 6,
      background: t.feltMid, border: `1px solid ${t.feltRule}`, borderRadius: 8,
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
            {uniqueCards.map((c, i) => (
              <MiniCardInline key={cardKey(c) + "-" + i} card={c} t={t} />
            ))}
          </div>
        )}
      </div>
      <span style={{
        fontFamily: t.fontMono,
        fontSize: 16, fontWeight: 600,
        color: accentGold ? t.goldBright : t.scorePositive,
        lineHeight: 1, flexShrink: 0,
      }}>+{item.pts}</span>
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

function ScoreBody({ feedback, kept, discarded, cut, handResult, cribResult, optHandResult, optResult, allOptions, isDealer, session, t }) {
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
            <div style={{
              display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
              fontSize: 13, color: t.textSecondary,
            }}>
              <span>Optimal keep:</span>
              {feedback.optKeep.map(c => (
                <MiniCard key={cardKey(c)} card={c} t={t} />
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
          {/* Score total — SF Mono display */}
          <div style={{ fontFamily: t.fontMono, fontSize: 40, fontWeight: 700, color: t.goldBright, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 12 }}>
            {handResult.total} <span style={{ fontSize: 16, color: t.textMuted, fontWeight: 500 }}>pts</span>
          </div>
          {/* Breakdown */}
          {handResult.log.map((item, i) => <ScoreLogRow key={i} item={item} t={t} />)}
          {!handResult.log.length && <div style={{ fontSize: 13, color: t.textSecondary }}>No scoring combinations</div>}
          {/* Optimal comparison */}
          {optResult && optHandResult && optHandResult.total !== handResult.total && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.feltRule}`, fontSize: 13, color: t.textSecondary }}>
              Optimal keep would have scored{" "}
              <span style={{ color: t.scoreMiss, fontWeight: 600, fontFamily: t.fontMono, letterSpacing: "-0.01em" }}>{optHandResult.total} pts</span>
            </div>
          )}
        </SectionBlock>
      )}

      {/* Crib score (dealer only) */}
      {isDealer && cribResult && (
        <SectionBlock title="Your Crib" t={t}>
          <div style={{ fontFamily: t.fontMono, fontSize: 32, fontWeight: 700, color: t.textPrimary, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 12 }}>
            {cribResult.total} <span style={{ fontSize: 14, color: t.textMuted, fontWeight: 500 }}>pts</span>
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
        <div style={{ background: t.feltLift, borderRadius: 999, height: 3, overflow: "hidden", marginBottom: 6 }}>
          <div style={{
            height: "100%", width: `${Math.min(100, eff)}%`,
            background: t.goldBright,
            borderRadius: 999, transition: "width 0.6s ease-out",
          }} />
        </div>
        <div style={{ fontFamily: t.fontMono, fontSize: 28, fontWeight: 700, color: effColor, letterSpacing: "-0.02em" }}>{eff}%</div>
      </SectionBlock>

      {/* All discard options — collapsible analysis table */}
      {allOptions.length > 0 && (
        <DiscardOptionsTable
          allOptions={allOptions}
          discarded={discarded}
          optKeep={feedback?.optKeep || null}
          isDealer={isDealer}
          t={t}
        />
      )}

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
  const [allOptions, setAllOptions] = useState([]);

  function dealNewHand() {
    const deck = [...fullDeck()].sort(() => Math.random() - 0.5);
    const newHand6 = deck.slice(0, 6).sort((a, b) => rankIdx(a.rank) - rankIdx(b.rank));
    setHand6(newHand6);
    setIsDealer(Math.random() > 0.5);
    setSelected([]); setKept([]); setDiscarded([]); setCut(null);
    setFeedback(null); setOptResult(null);
    setHandResult(null); setCribResult(null); setOptHandResult(null);
    setAllOptions([]);
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

    // ── Full discard analysis — all 15 options ranked by combined EV ────────
    const options = analyzeHand(hand6, isDealer);

    setFeedback(fb);
    setOptResult(opt);
    setKept(keptCards);
    setDiscarded(discardedCards);
    setCut(cutCard);
    setHandResult(hResult);
    setCribResult(cResult);
    setOptHandResult(optH);
    setAllOptions(options);
    setPhase("score");
  }

  function handleDealNewHand() {
    // Commit this hand to session before resetting
    if (phase === "score" && handResult) {
      const yourPts = handResult.total + (isDealer && cribResult ? cribResult.total : 0);
      const optPts = (optHandResult?.total || 0) + (isDealer && cribResult ? cribResult.total : 0);
      setSession(s => ({ hands: s.hands + 1, yourPts: s.yourPts + yourPts, optPts: s.optPts + optPts }));
      saveHandToHistory(feedback?.grade ?? "Suboptimal", yourPts, optPts);
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
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 8px", background: t.feltDeep }}>

        {phase === "discard" && <DiscardBody isDealer={isDealer} t={t} />}
        {phase === "score" && (
          <ScoreBody
            feedback={feedback}
            kept={kept} discarded={discarded} cut={cut}
            handResult={handResult} cribResult={cribResult}
            optHandResult={optHandResult} optResult={optResult}
            allOptions={allOptions}
            isDealer={isDealer} session={session} t={t}
          />
        )}

      </div>

      {/* ── Bottom dock — sticky ─────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: t.surfaceBg, borderTop: `1px solid ${t.border}` }}>

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
