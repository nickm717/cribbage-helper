import { useState, useEffect, useMemo } from "react";

// ─── Theme tokens — The Card Room ─────────────────────────────────────────
//
// Source of truth: DESIGN.md. OKLCH authored; values inlined here so the
// runtime doesn't depend on browser CSS-color-4 support for JS-style props.
// All contrast ratios verified against WCAG AA (4.5:1 normal text, 3:1 UI).

const FONT_UI   = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const FONT_CARD = "'Spectral', Georgia, 'Times New Roman', serif";
const FONT_MONO = "'SF Mono', ui-monospace, 'Cascadia Mono', 'Roboto Mono', 'Menlo', monospace";

/**
 * Build the Card Room theme for the given mode.
 * @param {boolean} dark @returns {Record<string, any>}
 */
export function makeTheme(dark) {
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
      fontUi: FONT_UI, fontCard: FONT_CARD, fontMono: FONT_MONO,
      // Suit-row tinted backgrounds. Lightness bumped above felt-mid so the
      // suit row reads as a clearly raised step. Hue tint stays subtle so
      // the felt-room aesthetic isn't disrupted.
      redSuitBg:     "oklch(38% 0.060 25)",
      blueSuitBg:    "oklch(38% 0.030 240)",
      redSuitHover:  "oklch(46% 0.080 25)",
      blueSuitHover: "oklch(46% 0.040 240)",
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
    redSuitBg:     "oklch(93% 0.035 25)",
    blueSuitBg:    "oklch(92% 0.025 240)",
    redSuitHover:  "oklch(88% 0.050 25)",
    blueSuitHover: "oklch(86% 0.035 240)",
  };
}

/**
 * Theme hook. Honors prefers-color-scheme, supports a manual override that
 * persists across reloads, and returns [theme, toggle, isDark].
 * @returns {[Record<string, any>, () => void, boolean]}
 */
export function useTheme() {
  const sysMq = typeof window !== "undefined"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : { matches: true };
  const [sysDark, setSysDark] = useState(sysMq.matches);
  const [override, setOverride] = useState(() => {
    try {
      const v = localStorage.getItem("cribbage_theme");
      return v === "dark" ? true : v === "light" ? false : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const h = e => setSysDark(e.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);

  const dark = override !== null ? override : sysDark;
  const theme = useMemo(() => makeTheme(dark), [dark]);

  const toggle = () => {
    setOverride(prev => {
      const next = prev === null ? !sysDark : !prev;
      try { localStorage.setItem("cribbage_theme", next ? "dark" : "light"); } catch { /* ignore */ }
      return next;
    });
  };

  return [theme, toggle, dark];
}
