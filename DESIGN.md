---
name: Cribbage Helper
description: A mobile-first cribbage scorer and discard trainer for serious students of the game.
colors:
  felt-deep: "oklch(18% 0.030 145)"
  felt-base: "oklch(24% 0.038 148)"
  felt-mid: "oklch(30% 0.042 150)"
  felt-lift: "oklch(36% 0.040 152)"
  felt-rule: "oklch(28% 0.028 148)"
  card-face: "oklch(96% 0.012 88)"
  card-warm: "oklch(92% 0.018 82)"
  gold-bright: "oklch(78% 0.138 78)"
  gold-muted: "oklch(68% 0.100 80)"
  gold-dim: "oklch(58% 0.070 82)"
  gold-glow: "oklch(78% 0.138 78 / 0.18)"
  score-positive: "oklch(72% 0.130 150)"
  score-miss: "oklch(60% 0.130 25)"
  suit-red: "oklch(60% 0.185 25)"
  suit-dark: "oklch(20% 0.018 148)"
  text-primary: "oklch(94% 0.012 88)"
  text-secondary: "oklch(70% 0.022 100)"
  text-muted: "oklch(68% 0.018 100)"
  text-on-card: "oklch(20% 0.025 145)"
  text-on-gold: "oklch(18% 0.030 80)"
  tier-grade-poor: "oklch(60% 0.130 25)"
  tier-grade-fair: "oklch(70% 0.140 50)"
  tier-grade-good: "oklch(78% 0.138 78)"
  tier-grade-strong: "oklch(72% 0.130 150)"
typography:
  display:
    fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  bodySm:
    fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.10em"
  cardRank:
    fontFamily: "'Spectral', Georgia, serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  numeric:
    fontFamily: "'SF Mono', ui-monospace, 'Cascadia Mono', 'Roboto Mono', monospace"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "normal"
  numericLg:
    fontFamily: "'SF Mono', ui-monospace, 'Cascadia Mono', 'Roboto Mono', monospace"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  card: "6px"
  pill: "999px"
spacing:
  sp-1: "4px"
  sp-2: "8px"
  sp-3: "12px"
  sp-4: "16px"
  sp-5: "20px"
  sp-6: "24px"
  sp-8: "32px"
  sp-10: "40px"
  sp-12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.gold-bright}"
    textColor: "{colors.text-on-gold}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
  button-secondary:
    backgroundColor: "{colors.felt-lift}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "7px 16px"
  button-deal:
    backgroundColor: "{colors.felt-mid}"
    textColor: "{colors.gold-bright}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  playing-card:
    backgroundColor: "{colors.card-face}"
    textColor: "{colors.text-on-card}"
    rounded: "{rounded.card}"
    padding: "8px"
  playing-card-back:
    backgroundColor: "{colors.felt-mid}"
    textColor: "{colors.gold-dim}"
    rounded: "{rounded.card}"
    padding: "0"
  score-row:
    backgroundColor: "{colors.felt-mid}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  score-row-total:
    backgroundColor: "{colors.felt-deep}"
    textColor: "{colors.gold-bright}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
  badge-positive:
    backgroundColor: "oklch(23% 0.050 150)"
    textColor: "{colors.score-positive}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-gold:
    backgroundColor: "oklch(23% 0.038 82)"
    textColor: "{colors.gold-bright}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-miss:
    backgroundColor: "oklch(22% 0.042 25)"
    textColor: "{colors.score-miss}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  nav-drawer-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  nav-drawer-item-active:
    backgroundColor: "{colors.gold-glow}"
    textColor: "{colors.gold-bright}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
---

# Design System: Cribbage Helper

## 1. Overview

**Creative North Star: "The Card Room"**

A serious card room you can hold in your hand. Deep felt under warm cream cards, aged-gold accents on the math that matters, a hush around the table that lets the player think. The visual system is built around the same premise as the product: the user is here on purpose, deliberately, to get better. The room is set for that.

We treat the centuries-old visual language of card tables as the inheritance and the constraint. Felt under cards. Serif rank glyphs on cream stock. Gold for value, green for a positive result, red for a miss. Nothing modern app design has invented in the last decade is in here because it would clash with the table itself. What modern design contributes is the chrome around the table: system-native UI typography, mobile-thumb-first ergonomics, deterministic feedback loops, accessibility done right.

The line we never cross is the slot machine. The dark felt is a private game-room at midnight, not a casino floor at noon. Aged gold, not Vegas neon. No animations celebrating routine actions. No ornament that doesn't appear on a real deck.

**Key Characteristics:**
- Dark green felt as the primary surface across all screens. The felt is the canvas; cards float on it.
- Three typographic families, each with one job: SF Pro for UI, Spectral for card faces, SF Mono for numeric data.
- One chromatic accent: aged gold. Used sparingly, on the math the player should trust.
- Score outcomes carry semantic color: green when something paid off, red when something was missed.
- Mobile-thumb-first. Primary actions in the bottom third, safe-area-inset aware.
- WCAG 2.1 AA verified on every documented color pair.

## 2. Colors: The Card Room Palette

OKLCH is the source of truth for every color (perceptually uniform; chroma drops cleanly at lightness extremes). Hex approximations are listed in parentheses for tooling that needs sRGB, but the OKLCH value is what the build resolves to.

### Felt Surfaces (the primary canvas)
- **Felt Deep** `oklch(18% 0.030 145)` (≈ `#15201a`): The lowest surface. App canvas, score-total backgrounds, drawer overlay backdrop. The darkest value in the system.
- **Felt Base** `oklch(24% 0.038 148)` (≈ `#1b2d22`): The primary surface. Card containers, header strip behind the title.
- **Felt Mid** `oklch(30% 0.042 150)` (≈ `#233a2c`): Raised surface. Score rows, secondary buttons, badges, the bottom dock.
- **Felt Lift** `oklch(36% 0.040 152)` (≈ `#2c4636`): The highest felt. Hover states, borders on secondary buttons, peg-track group dividers.
- **Felt Rule** `oklch(28% 0.028 148)` (≈ `#233429`): The only border color. Hairline divider between sections.

### Card Face (the warm cream surface for playing cards)
- **Card Face** `oklch(96% 0.012 88)` (≈ `#f5f0e6`): The default cream of every playing card. Never quite white; always warm.
- **Card Warm** `oklch(92% 0.018 82)` (≈ `#ede5d4`): A second cream, slightly darker. Used on the cut card to differentiate from the four hand cards.

### Aged Gold (the one chromatic accent)
- **Gold Bright** `oklch(78% 0.138 78)` (≈ `#d8a946`): The accent. Active states, the optimal-play indicator, the score-total digit, the active nav item. Contrast 9.20:1 on Felt Deep (AAA), 6.60:1 on Felt Mid (AA).
- **Gold Muted** `oklch(68% 0.100 80)` (≈ `#b08838`): Hover/secondary gold. Disabled gold states.
- **Gold Dim** `oklch(58% 0.070 82)` (≈ `#856828`): Decorative gold, never used for text. Borders on the Deal button, card-back glyph. 3.11:1 on Felt Mid (passes WCAG 1.4.11 Non-Text Contrast for graphics).
- **Gold Glow** `oklch(78% 0.138 78 / 0.18)`: 18% alpha gold for soft accent backgrounds (active nav item) and ambient shadow tinting on the primary CTA hover.

### Semantic (score outcomes)
- **Score Positive** `oklch(72% 0.130 150)` (≈ `#4ab27a`): A soft, instrumented green. The score-row "+pts" value, the dealer-side pill, the efficiency-bar fill. 7.95:1 on Felt Deep (AAA).
- **Score Miss** `oklch(60% 0.130 25)` (≈ `#b54e3f`): A muted brick-red. Points the player gave up to opponent's crib, missed-optimal indicators.

### Suit (card surfaces only)
- **Suit Red** `oklch(60% 0.185 25)` (≈ `#c44132`): ♥ and ♦ glyphs on the cream Card Face. 3.85:1 against Card Face — passes WCAG 1.4.11 for graphical signals at 13px+.
- **Suit Dark** `oklch(20% 0.018 148)` (≈ `#1d2520`): ♠ and ♣ glyphs on the Card Face. 16.03:1 against Card Face (AAA).

### Ink (text)
- **Text Primary** `oklch(94% 0.012 88)` (≈ `#f0ecdf`): App title, body text, score-row primary labels. 15.69:1 on Felt Deep.
- **Text Secondary** `oklch(70% 0.022 100)` (≈ `#aea99b`): Supporting copy, score-row labels. 5.03:1 on Felt Mid (AA).
- **Text Muted** `oklch(68% 0.018 100)` (≈ `#a8a499`): Letterspaced uppercase labels, metadata, sub-text under score rows. 4.67:1 on Felt Mid (AA). This is the legibility floor; never go lower for readable text.
- **Text On Card** `oklch(20% 0.025 145)` (≈ `#1d2520`): The deep value for any text on the cream Card Face. 16.03:1.
- **Text On Gold** `oklch(18% 0.030 80)` (≈ `#2a2010`): Used on Gold Bright surfaces (primary CTA label). Warm-shifted near-black so it harmonizes with the gold underneath.

### Tier Grade (efficiency / score-quality palette, four steps)
Used exclusively on the Trainer's session efficiency value and per-hand quality grade.
- **Poor** `oklch(60% 0.130 25)` — under 60% efficiency
- **Fair** `oklch(70% 0.140 50)` — 60–74%
- **Good** `oklch(78% 0.138 78)` (same as Gold Bright) — 75–89%
- **Strong** `oklch(72% 0.130 150)` (same as Score Positive) — 90% and above

### Named Rules

**The One Voice Rule.** Gold Bright appears on ≤10% of any given screen and on at most one logical region at a time (the selected card, the active nav item, the score total). Its rarity is the point.

**The Felt-As-Surface Rule.** Every chrome surface in the app is felt — Deep / Base / Mid / Lift, no other neutral. Never reach for a "card" panel in mid-gray; the only off-felt surface in the system is the Card Face cream, and it belongs to playing cards alone.

**The Suit Quarantine Rule.** Suit Red and Suit Dark exist on the Card Face only. They never appear on chrome buttons, chrome text, or dividers. The cream Card Face is the only background that suit colors are designed against.

**The Semantic Color Rule.** Score Positive (green) and Score Miss (red) carry meaning, not decoration: they appear on values that have outcome polarity (points earned, points missed). Static UI elements never use them.

## 3. Typography

**Three families, each with one job.**

- **SF Pro** (`-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui`) — every UI string in the app: titles, body, labels, button text, instruction copy. System-resolved so it's SF Pro on Apple platforms, Segoe UI on Windows, Roboto on Android. Zero font load.
- **Spectral** (`'Spectral', Georgia, serif`) — playing card faces only. The rank pip and the suit glyph on a card. Spectral is a modern serif by Production Type; warmer and more readable than Playfair, less editorial. Loaded as a webfont (Google Fonts) at weight 700.
- **SF Mono** (`'SF Mono', ui-monospace, 'Cascadia Mono', 'Roboto Mono', monospace`) — every numeric value the user reads as data: score totals, efficiency %, "+2 pts" on score rows, peg positions. Tabular by default; no separate `tabular-nums` directive needed.

### Hierarchy

- **Display** (SF Pro 700, 48px, -0.03em, line-height 1): The biggest moment. Page-level header context only.
- **Title** (SF Pro 700, 28px, -0.02em, line-height 1.1): Screen header titles ("Cribbage Trainer", "Hand Score").
- **Heading** (SF Pro 600, 21px, -0.02em): Section headings inside a screen.
- **Body** (SF Pro 400, 15px, line-height 1.5): Default paragraph text and instruction copy.
- **Body Sm** (SF Pro 500, 13px): Score-row labels, secondary information.
- **Label** (SF Pro 600, 11px, letter-spacing 0.10em, uppercase): Section labels ("SESSION EFFICIENCY"), role tags, peg-track headers.
- **Card Rank** (Spectral 700, 17px): The rank pip on a playing card (top-left, bottom-right). Sized down to 13px for suit glyphs.
- **Numeric** (SF Mono 500, 17px): Inline numeric values — score-row points, badge counts, peg numbers.
- **Numeric Lg** (SF Mono 700, 36–48px, -0.01em): Display numbers — score total, efficiency value.

### Named Rules

**The Three-Family Rule.** SF Pro for UI text. Spectral for card faces. SF Mono for numbers. No other typography enters the system. Each family has one and only one job; mixing them on the same element (Spectral score, SF Mono title) is forbidden.

**The Numbers-Are-Mono Rule.** Any number a player reads as data — score total, efficiency, "+pts", peg position — is set in SF Mono. The reason is twofold: monospace digits hold their column when values change (no width jump 87→100); and the change of family at the moment of a number reinforces that something is being counted.

**The Card-Face-Is-Spectral Rule.** Spectral appears only on the cream Card Face. Never in UI text, never in scores, never in chrome. The serif on a card honors the source; the serif anywhere else would be costume jewelry.

**The Letterspaced-Cap Label Rule.** Labels (≤11px) are uppercase with 0.10em letter-spacing. Sentence-case small text reads as cramped body; letterspaced caps read as label.

## 4. Elevation

The system is **softly layered, not flat**. Depth comes from two sources used together: tonal felt layering (Deep → Base → Mid → Lift) and ambient shadow on playing-card surfaces. Chrome never shadows; cards always do.

### Shadow Vocabulary

- **Card Rest** `0 2px 8px oklch(0% 0 0 / 0.35), 0 1px 2px oklch(0% 0 0 / 0.25)`: The default shadow under an unselected playing card. Two layers: a soft diffuse drop and a tight contact shadow. Reads as a card lying on felt.
- **Card Hover** `0 8px 24px oklch(0% 0 0 / 0.45), 0 2px 6px oklch(0% 0 0 / 0.30)`: The card has lifted 6px off the felt and rotated -0.5deg. Larger blur, deeper opacity.
- **Card Selected** `0 0 0 2px gold-bright, 0 6px 20px oklch(0% 0 0 / 0.45)`: The selected playing card. A crisp gold ring plus an elevated drop shadow.
- **CTA Glow** `0 2px 8px gold-glow` (`0 4px 16px gold-glow` on hover): Soft amber halo under the primary CTA button.

### Named Rules

**The Cards-Float, Chrome-Doesn't Rule.** Only playing cards (objects that map to physical cards in cribbage) cast shadows. UI chrome — buttons, panels, dock, score rows — is flat at rest and uses felt-tonal layering for depth.

**The Two-Layer Shadow Rule.** Card shadows are always two layers: a soft diffuse layer for atmosphere and a tight contact-shadow layer for grounding. A single-layer drop shadow looks 2014.

## 5. Components

### Buttons

- **Primary CTA.** Gold Bright background, Text On Gold label, 8px radius, 14×24px padding, soft amber glow shadow. The one moment of commitment on a screen ("Discard to Crib", "Score Hand"). One per screen.
- **Secondary.** Felt Lift background, Text Primary label, hairline border in `oklch(42% 0.033 148)`. 10×20px padding. Sits next to a Primary for non-CTA actions.
- **Ghost.** Transparent background, Text Secondary label, hairline Felt Rule border. 7×16px padding. For tertiary actions and inline links.
- **Deal.** Felt Mid background, Gold Bright label, Gold Dim border. The signature button: it reads like a button on the felt itself. Used for "Deal New Hand", "Next Hand". Gains CTA glow on hover.
- **Hover/Focus:** All buttons shift one tonal step lighter on hover. Primary CTA additionally translateY(-1px). No buttons scale on hover. Active state: scale(0.97) on press.

### Playing Cards

- **Shape:** 72×102px, 6px radius. Card Face background. 2-layer Card Rest shadow.
- **Anatomy:** Top-left and bottom-right carry the rank + suit glyph (bottom-right rotated 180°). Center carries a large suit glyph in full suit color (≈30px on the 54×78 trainer cards) — the prominent focal point, like the pip on a real playing card.
- **Typography:** Rank in Spectral 700 17px. Suit at 13px. ♥♦ in Suit Red; ♠♣ in Suit Dark.
- **Default:** Card Rest shadow.
- **Hover:** translateY(-6px) + rotate(-0.5deg). Card Hover shadow. The rotation is the personality move: a card you point at picks up a slight tilt, like nudging it with a finger.
- **Selected:** translateY(-10px). Card Selected shadow (2px gold ring + drop). No rotation.
- **Card Back:** Felt Mid surface with a 2px Felt Lift inner border and a 1px diagonal repeating-linear-gradient hatch pattern at 7px spacing. A center Gold Dim diamond glyph at 55% opacity. Used during deal animations and on the cut card before it's flipped.

### Score Rows (Signature Component)

The score breakdown — best-improved pattern in v2. Each row carries three pieces:
- **Label** (Body Sm, Text Secondary): the scoring rule ("Three of a kind", "Fifteen (5+10)", "Nobs").
- **Sub** (SF Mono, 11px, Text Muted): the specific cards that scored ("4♠ 4♣ 4♥", "5♣ 10♦", "J♦ matches cut suit"). This is the line that turns a count into a teaching moment.
- **Points** (SF Mono, 17px Score Positive — or Gold Bright for special scores like Nobs).

Row surface: Felt Mid, Felt Rule border, 8px radius, 12×20px padding, 8px vertical gap between rows.

The Total row breaks pattern: Felt Deep background, larger padding (16×20px), Gold Bright score in Numeric Lg (SF Mono 28px+).

### Efficiency Bar (Trainer)

- **Layout:** Letterspaced "SESSION EFFICIENCY" label above a large SF Mono Gold Bright value (36px), with the `%` sign in smaller Text Muted SF Pro. 3px progress track below.
- **Track:** Felt Lift background, Gold Bright fill. Pill-shaped (border-radius 999px).
- **Empty state:** No fill, em-dash in place of the percentage. The bar must not show false progress before any hands have been played.

### Crib Destination (Trainer Discard Phase)

The replacement for the legacy DEALER / PONE pill. A three-line headline that uses plain language:
- **Label** "DISCARDING TO" (Label style, 11px, Text Muted)
- **Headline** "Your crib" or "Opponent's crib" (SF Pro Bold 24–28px, Text Primary, -0.01em)
- **Implication** "These two cards score for you" / "...for them" (Body Sm, Text Secondary)

No emoji, no icons. Strategic posture is taught through the implication line.

### Role Pills (Future Surface — Pegging Only)

Reserved exclusively for the future pegging surface, where the technical Dealer / Pone term is unavoidable. Never used in the discard-phase UI.

- **Pone Pill:** Felt-tinted gold background `oklch(26% 0.042 82)`, Gold Bright text, gold border `oklch(40% 0.065 80)`. Letterspaced uppercase 11px, pill-shaped.
- **Dealer Pill:** Felt-tinted green background `oklch(24% 0.042 148)`, Score Positive text, green border `oklch(38% 0.055 150)`. Same shape, different palette.
- **Dot:** A 7px filled circle in the matching text color, leading the label.

### Score Badges

Letterspaced inline pills for inline status. SF Mono inside, 13px Medium.
- **Positive:** dark green tint, Score Positive text. "+12 pts"
- **Gold:** dark gold tint, Gold Bright text. "Nobs +1"
- **Miss:** dark red tint, Score Miss text. "Missed +4"
- **Neutral:** Felt Mid background, Text Secondary text. "0 pts"

Each carries a 5px filled `badge-dot` in matching color before the value.

### Pegging Track (Future Surface)

Documented now so the visual language is locked when we get there. No code yet.
- **Layout:** A horizontal row of `peg-group` units. Each unit is a 14×14px peg-hole circle stacked over an 8px SF Mono peg-number.
- **Hole states:** Empty (Felt Mid fill, Felt Lift border), Player 1 (Gold Bright fill with subtle gold glow), Player 2 (Score Miss / red fill).
- **Dividers:** Vertical 1px Felt Lift dividers between groups of 5 (every street).
- **Container:** Felt Deep background, Felt Rule hairline border, 12px radius, 16px padding.

### Nav Drawer

- **Panel:** 260px wide, slides from left, Felt Base background, Felt Rule right edge. Overlay scrim at `oklch(0% 0 0 / 0.5)`.
- **Item:** 14×16px padding, 8px radius, transparent background, Text Primary label.
- **Item Active:** Gold Glow background (`gold-bright` at 18% alpha), Gold Bright label. No side-stripe.
- **Animation:** Panel translates from -100% to 0 over 200ms ease-out. Overlay opacity in parallel.

## 6. Do's and Don'ts

### Do:
- **Do** use Felt Deep/Base/Mid/Lift as the entire chrome palette. Every UI surface is felt.
- **Do** use SF Pro for UI text, Spectral 700 for card ranks/suits, SF Mono for any number a player reads as data.
- **Do** use Gold Bright sparingly: one logical region per screen, ≤10% of pixels. Reserve it for moments the math has decided.
- **Do** use Score Positive (green) for points earned and Score Miss (red) for points missed. Outcome polarity is the only reason these colors appear.
- **Do** ground every playing card with the two-layer Card Rest shadow. Cards float; chrome doesn't.
- **Do** lift the card -6px and rotate it -0.5deg on hover. The rotation is the personality.
- **Do** include the cards-that-scored sub-line on every score row. The sub-text turns a count into a teaching moment.
- **Do** apply tier-grade color (Poor/Fair/Good/Strong) to the session efficiency value and the per-hand quality grade, exclusively.
- **Do** maintain WCAG AA on text and 3:1 on graphical signals. The v2 contrast audit is the contract.
- **Do** name new colors with the `felt-*` / `card-*` / `gold-*` / `text-*` / `score-*` prefix system. Don't invent loose naming.
- **Do** ease motion out with `cubic-bezier(0.22, 0.8, 0.36, 1)` for cards and `cubic-bezier(0.16, 0.8, 0.44, 1)` for UI.

### Don't:
- **Don't** introduce a second chromatic accent. Aged gold is the only chromatic chrome color. Suit reds and the semantic green/red are quarantined to their roles.
- **Don't** use side-stripe borders (`border-left: 3px solid …`) as a colored accent. Use full borders, background tints, or nothing.
- **Don't** use Spectral or any serif in UI chrome. Spectral on a button or score panel is costume jewelry.
- **Don't** use SF Mono for prose, labels, or UI text. SF Mono is exclusively for numbers a player reads as data.
- **Don't** ship slot-machine gold gradients, garish bright greens, ornate filigree borders, dice-and-chips iconography, or any other Vegas-floor motif. Aged gold and deep felt are the opposite of this.
- **Don't** ship DEALER / PONE jargon in player-facing copy. Use "Your crib" / "Opponent's crib" in the discard phase. The Dealer/Pone role pills are reserved for the future pegging surface only.
- **Don't** ship cartoon mascots, rainbow tap celebrations, or bubble-button drop shadows.
- **Don't** ship the hero-metric template (big number + label + supporting stats + gradient accent).
- **Don't** ship modal dialogs as a first-resort UI. The drawer is the system's only overlay pattern.
- **Don't** translate buttons on hover beyond -1px on the primary CTA. Hover is a tint shift; lift is reserved for cards.
- **Don't** use em dashes in user-visible copy. Commas, colons, periods, parentheses.
- **Don't** use gradient text or `background-clip: text`. Emphasis is a job for weight and size.
- **Don't** use single-layer drop shadows on cards. Two layers minimum: diffuse atmosphere + tight contact.
