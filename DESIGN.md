---
name: Cribbage Helper
description: A mobile-first cribbage scorer and discard trainer for serious students of the game.
colors:
  marker-gold: "#f5b800"
  marker-gold-light: "#b8860b"
  late-night-charcoal: "#111111"
  study-surface: "#1c1c1e"
  raised-surface: "#2c2c2e"
  sunken-well: "#161618"
  quiet-divider: "#3a3a3c"
  primary-ink: "#f2f2f7"
  secondary-ink: "#aeaeb2"
  muted-ink: "#6c6c70"
  disabled-ink: "#3a3a3c"
  heart-diamond-red: "#ff6b6b"
  spade-club-blue: "#74b9ff"
  red-suit-bg: "#2e1515"
  blue-suit-bg: "#12233a"
  card-cream: "#f5f0e8"
  score-tier-1: "#a78bfa"
  score-tier-2: "#f87171"
  score-tier-3: "#fb923c"
  score-tier-4: "#34d399"
  fog-grey: "#f2f2f7"
  page-white: "#ffffff"
typography:
  display:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "56px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  title:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "normal"
  rank:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "16px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  xs: "4px"
  sm: "7px"
  md: "10px"
  lg: "12px"
  xl: "18px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.marker-gold}"
    textColor: "{colors.study-surface}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "{colors.raised-surface}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  rank-pill:
    backgroundColor: "{colors.raised-surface}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.xs}"
    padding: "8px 6px"
    typography: "{typography.rank}"
  rank-pill-selected:
    backgroundColor: "{colors.marker-gold}"
    textColor: "{colors.study-surface}"
    rounded: "{rounded.xs}"
    padding: "8px 6px"
  card-slot:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "0"
  playing-card:
    backgroundColor: "{colors.card-cream}"
    textColor: "{colors.study-surface}"
    rounded: "{rounded.sm}"
    padding: "0"
  nav-drawer-item:
    backgroundColor: "transparent"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  nav-drawer-item-active:
    backgroundColor: "{colors.marker-gold}"
    textColor: "{colors.marker-gold}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
---

# Design System: Cribbage Helper

## 1. Overview

**Creative North Star: "The Study Companion"**

A pocket coach for serious cribbage players. The visual system is built around one premise: the user is here on purpose, holding the phone in one hand, running through hands deliberately. Every screen is a single decision space. Color stays out of the way until the math has a verdict to deliver. Typography honors the source material (real cards have serif ranks) without leaning into card-game cliché. Soft ambient depth throughout, never theatrical lift.

The product side of the personality is Raycast's discipline (one task per screen, quiet chrome, the work is the foreground). The brand side is Duolingo's loop (small, repeated wins; the reward arrives at the moment of feedback, not before). The two register as one system because both refuse decoration that doesn't serve the loop.

This system explicitly rejects four neighboring aesthetics: the green-felt Vegas table (no felts, no gold filigree, no dice iconography), the bubble-button mobile game (no chunky drop shadows, no rainbow celebrations, no mascots), generic SaaS dashboards (no hero-metric template, no identical card grids, no navy gradients), and brutalist statement work (no raw HTML, no monospace shouting, no harsh black borders as ornament).

**Key Characteristics:**
- Dark by default, light supported. The default user is studying on a phone after dinner, room dimmed; the dark canvas is where the cards read best.
- One accent. Marker Gold (#f5b800) is the only chromatic color in the chrome. Suit reds and blues live only on cards, not on UI.
- Serif for cards and totals, sans for chrome. The rank on a card and the score that came from those cards are the same typographic voice.
- Mobile-thumb-first. Primary actions live in the bottom third; safe-area insets are non-negotiable.
- Tactile components. 10–18px radii, generous padding, soft shadows. Friendly without being childish.

## 2. Colors: The Study Companion Palette

A near-monochrome chrome (tinted charcoals in dark mode, tinted whites in light) plus one warm accent that only appears when the math says something. Suit colors are quarantined to the playing cards themselves.

### Primary
- **Marker Gold** (#f5b800 dark, #b8860b light): The one chromatic voice. Marks state the math has decided — the active card slot, the selected rank, the optimal play, the active nav item. Contrast on Raised Surface is 4.7:1 (dark) / 4.6:1 (light), both AA. Never used for decoration, never used in groups of more than one per region.

### Neutral (Dark Theme — canonical)
- **Late-Night Charcoal** (#111111): The page canvas behind the card container. Also fills iOS safe-area regions so the notch and home indicator disappear into the design.
- **Study Surface** (#1c1c1e): The primary working surface — the card container, the header strip, the score panel. Contrast on this surface is the contract: Primary Ink reads 14.7:1 on it.
- **Raised Surface** (#2c2c2e): Buttons, badges, the inactive rank pills. One step closer to the user than Study Surface.
- **Sunken Well** (#161618): Recessed surfaces — the empty card slot before a card is placed, the score itemization panel. One step away from the user than Study Surface.
- **Quiet Divider** (#3a3a3c): The only border value. Used as a hairline (1px), never as a stripe.

### Neutral (Light Theme)
- **Fog Grey** (#f2f2f7): page canvas
- **Page White** (#ffffff): primary surface
- **Raised Surface** (#e5e5ea): raised
- **Sunken Well** (#f2f2f7): recessed (matches canvas; intentional)
- **Quiet Divider** (#c7c7cc): hairlines

### Ink (Text Hierarchy)
- **Primary Ink** (#f2f2f7 / #1c1c1e): All body and heading text. 14.7:1 / 18.1:1 contrast.
- **Secondary Ink** (#aeaeb2 / #3a3a3c): Helper text, score row reasons, the "Hand value" subtitle. 5.0:1 / 13.4:1.
- **Muted Ink** (#6c6c70 / #8e8e93): Inactive icon tints. Never used for actionable text.
- **Disabled Ink** (#3a3a3c / #c7c7cc): Disabled chip text, used-up rank pills.

### Suit (Card Surfaces Only)
- **Heart/Diamond Red** (#ff6b6b dark, #b91c1c light): ♥ and ♦ rank glyphs.
- **Spade/Club Blue** (#74b9ff dark, #1e3a5f light): ♠ and ♣ rank glyphs.
- **Red Suit Background** (#2e1515 dark) / **Blue Suit Background** (#12233a dark): Subtle tinted backgrounds behind suit-row buttons, signaling which suits sit where without shouting.
- **Card Cream** (#f5f0e8): The physical playing card surface — never quite white, slightly warm, off-paper. The only cream in the system.

### Score Tier (Palette of Four)
- **Tier 1 Purple** (#a78bfa / #7c3aed), **Tier 2 Red** (#f87171 / #dc2626), **Tier 3 Orange** (#fb923c / #c2410c), **Tier 4 Green** (#34d399 / #15803d): Used on the score-total digit to encode hand value bracket (low / medium / good / great). The only place in the system where a palette of more than one color is permitted.

### Named Rules

**The One Voice Rule.** Marker Gold appears on ≤10% of any given screen and on at most one logical region at a time (one selected card, one active rank, one optimal play badge). Its rarity is the point. If two things compete for gold, neither should be gold; the architecture is wrong.

**The Suit Quarantine Rule.** Red and Blue suit colors exist on playing-card surfaces only — never on buttons, never on text, never on dividers. Suit-tinted button backgrounds (Red Suit Bg / Blue Suit Bg) are the only exception, and they are dark enough to read as neutral until you look twice.

**The No-Pure-Black, No-Pure-White Rule.** The darkest value in the system is #111111, the lightest in light mode is #ffffff (a deliberate exception for the surface; canvas is #f2f2f7). Body text is never #fff on dark, never #000 on light. Tinted neutrals throughout.

## 3. Typography

**Display Font:** 'Playfair Display' (with Georgia, serif fallback)
**Body Font:** system-ui, -apple-system, sans-serif
**Card Rank:** Playfair Display 900 — same family as Display, different weight

**Character:** A serif that knows it's a serif (Playfair has high stroke contrast and elegant ball terminals) paired with the platform's native sans. The serif appears wherever the product is being a card game — card ranks, score totals, screen titles. Sans handles everything else. The contrast is the point: when serif appears, something cardish is happening.

### Hierarchy
- **Display** (Playfair 800, 56px, line-height 1): The score total. The single biggest moment in the app. Appears once per screen, dead center, color-tiered by value.
- **Title** (Playfair 800, 20px, line-height 1.1): App header title ("Cribbage Scorer" / "Cribbage Trainer"). Sits left of the hamburger.
- **Rank** (Playfair 900, 14–16px depending on context): The rank pip on a playing card and on the rank-strip selector. Identical typographic voice across the whole app — a 5 on the rank strip is the same 5 you'll see on the card it produces.
- **Body** (system sans, 13px, weight 600, line-height 1.4): Score row reasons, in-context instruction copy, button labels.
- **Label** (system sans, 9–11px, weight 700, letter-spacing 0.08em, uppercase): Trainer stat chips ("HANDS", "EFFICIENCY"), section labels, role tags like "DEALER".

### Named Rules

**The Serif-for-Substance Rule.** Playfair is reserved for: card ranks, score totals, app title. Sans handles everything else. Never use serif for button labels, instruction copy, or chrome. The serif is a signal that the user is looking at game material, not UI.

**The Letterspaced-Cap Label Rule.** Small labels (≤11px) are always uppercase with 0.08em letter-spacing. Sentence-case small text reads as cramped body text; uppercase letterspacing makes it read as a label.

## 4. Elevation

The system is **softly layered, not flat**. Depth comes from two sources used together: tonal layering on chrome (Sunken Well → Surface → Raised) and ambient shadow on physical-object metaphors (playing cards, the desktop card container, the sticky bottom dock). Nothing is harsh. No directional shadows, no inner shadows, no lift on hover unless something is genuinely moving.

### Shadow Vocabulary
- **Card Rest** (`box-shadow: 0 3px 8px rgba(0,0,0,0.45)`): The shadow under an unselected playing card. Reads as a card lying on a table.
- **Card Lifted** (`box-shadow: 0 8px 20px rgba(0,0,0,0.55), 0 0 0 2px var(--marker-gold)`): The selected playing card. Higher, softer, plus the gold ring. Used for the discard selection in Trainer.
- **Container Ambient** (`box-shadow: 0 10px 40px rgba(0,0,0,0.4)`): The desktop card container on the page canvas. Subtle, atmospheric, large blur.

### Named Rules

**The Cards-Float, Chrome-Doesn't Rule.** Only objects that map to physical things in cribbage (the playing cards) cast meaningful shadows. UI chrome — buttons, panels, the score total — is flat at rest and uses tonal layering for depth. This keeps the mental model clean: cards are objects you manipulate; chrome is the workspace.

**The No-Hover-Lift Rule.** Buttons do not translate up on hover. Hover changes background tint, never position. Lift is reserved for the card-selected state, where it carries real meaning (this is the card you've picked).

## 5. Components

### Buttons
- **Shape:** Soft (radius 10px on primary actions, 12px on suit row, 4px on rank pills — the smallest interactive elements).
- **Primary (action / CTA):** Marker Gold background, Study Surface text. Padding 12×16px. Used for "Discard →", "Deal New Hand →". One per screen.
- **Secondary:** Raised Surface background, Primary Ink text. Same shape and padding as Primary. Used for inactive states and non-CTA actions.
- **Selected state:** When a button is the currently-selected option in a group (e.g. the rank strip's active rank, the mode toggle's active mode), background flips to Marker Gold and text to Study Surface. This is the same treatment as Primary, by design: selected and primary are the same idea (this is the chosen path).
- **Hover/Focus:** Background tint shifts one step lighter. No translation, no scale.

### Rank Pills (Signature Component)
- **Shape:** 4px radius (smallest in the system; they're the most numerous).
- **Style:** Raised Surface background, Primary Ink text, Playfair 900 typography. Inactive at rest.
- **Selected:** Marker Gold background, dark text. One can be selected at a time per strip.
- **Used (all 4 cards of that rank placed):** Sunken Well background, Disabled Ink text. Reads as unavailable without being aggressively struck-through.

### Playing Cards (Signature Component)
- **Shape:** 7px radius. Card Cream background (#f5f0e8) — warm, paper-like, never #fff.
- **Anatomy:** Top-left and bottom-right corners carry the rank + suit (the bottom-right is rotated 180° per real-deck convention). Center carries a large suit glyph.
- **Suit color:** ♥♦ in Heart-Diamond Red, ♠♣ in Heart-Diamond Blue. The suit glyph is always present alongside the color — color alone is never the suit signal.
- **Rest state:** Card Rest shadow.
- **Selected state:** Card Lifted shadow + 2px Marker Gold border + raised position (translate or absolute-position offset). Z-index ensures the selected card paints above neighbors when in an overlapping fan; the current spec uses a flat row so this matters less, but the rule stands.
- **Dimmed state:** Opacity 0.35. Used when other cards are selected and this card is not.

### Card Slots (Scorer)
- **Shape:** 10px radius. Sunken Well background when empty, transparent when filled (the card itself sits in the slot).
- **Empty:** A subtle dashed or tinted box prompting "tap to add". Marker Gold outline when this slot is the next target.
- **Filled:** The Playing Card sits flush inside; the slot is invisible.

### Suit Row
- **Shape:** 12px radius.
- **Style:** Red Suit Background (#2e1515) behind ♥♦, Blue Suit Background (#12233a) behind ♠♣. The tints are dark enough that they read as neutral until the eye lingers. Suit glyph is Heart-Diamond Red or Spade-Club Blue at 18–24px.
- **Active:** Marker Gold outline ring (2px), not a fill — the tint stays.

### Score Panel
- **Score Total:** Display typography (Playfair 800, 56px), color-tiered. Sits centered above the itemized list. The single biggest object on the screen by far.
- **Itemized List:** Each row uses Sunken Well background, 10px radius, 9px vertical padding. Left column: a Raised Surface point-badge ("+2"). Right column: Secondary Ink reason text, Primary Ink for the reason itself.

### Navigation Drawer
- **Shape:** Panel slides from left, 260px wide, Study Surface background, Quiet Divider hairline on the right edge. Overlay scrim at rgba(0,0,0,0.5).
- **Item style:** 14×16px padding, transparent background, Primary Ink text. Optional leading icon.
- **Item active:** Marker Gold text. Background tinted with Marker Gold at 12% opacity (`#f5b80020`). NO side-stripe border (see Don'ts).
- **Animation:** Panel translates from -100% to 0 over 200ms, ease-out. Overlay opacity 0→1 in parallel.

### Trainer Stat Chips
- **Style:** Letterspaced-cap label above a numeric value. No background, no border. Grid of 4 (HANDS, EFFICIENCY, YOUR PTS, OPT PTS) below the header, separated by Quiet Divider hairlines (top and bottom only).

## 6. Do's and Don'ts

### Do:
- **Do** use Marker Gold (#f5b800) at ≤10% per screen, on one logical region at a time.
- **Do** use Playfair Display for card ranks, score totals, and the screen title. Sans-serif everywhere else.
- **Do** keep the playing card's center suit glyph at 24–30px so it reads from arm's length.
- **Do** show the suit glyph (♠♥♦♣) every time suit color is used, so color-blind users are never blocked.
- **Do** treat the bottom of the mobile screen as primary real estate. Sticky dock, safe-area insets, primary actions within thumb reach.
- **Do** use 10–12px radii on chrome and 7px on playing cards. The card is the only sharper-cornered surface (real cards have sharper corners than buttons in this system).
- **Do** ease motion out with `cubic-bezier(0.4, 0, 0.2, 1)` or steeper exponential curves over 150–200ms.
- **Do** maintain WCAG AA contrast across both themes. The token-comment contrast notes in `App.jsx` are part of the contract.

### Don't:
- **Don't** use side-stripe borders (`border-left: 3px solid …`) as a colored accent on cards, list items, or nav items. The current `NavDrawer` active-item left stripe is a documented violation pending replacement: use the Marker-Gold-at-12% background tint alone, with Marker Gold text. The full border around an item is fine; a single colored stripe is not.
- **Don't** introduce a second chromatic chrome color. There is one accent (Marker Gold). Suit reds and blues are quarantined to cards.
- **Don't** use #000 or #fff for chrome. Late-Night Charcoal (#111111) is the darkest value; tinted whites only in light mode.
- **Don't** ship green felt, gold gradients, ornate borders, or any other Vegas-casino motif. This is a study tool, not a slot machine.
- **Don't** ship cartoon mascots, rainbow celebrations, or bubble-button drop shadows. Playful does not mean infantilizing.
- **Don't** ship the hero-metric template (big number, small label, supporting stats, gradient accent). The Trainer's stat row is intentionally a flat letterspaced-label grid, not a SaaS dashboard hero.
- **Don't** ship identical card grids of icon-plus-heading-plus-text. The score panel and the playing cards are the only "card" shapes in the system; everything else is flat surface.
- **Don't** ship modal dialogs as a first-resort UI. The drawer pattern is the only overlay pattern the system commits to. New flows should be inline phases (see Trainer's discard → score), not modals.
- **Don't** translate buttons on hover. Hover shifts background tint only. Lift is reserved for the selected card.
- **Don't** use em dashes in copy. Use commas, colons, periods, or parentheses.
- **Don't** use gradient text or background-clip: text. Emphasis is a job for weight and size.
