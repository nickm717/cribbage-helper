# Product

## Register

product

## Users

Serious cribbage players and students of the game. They already know the rules; they want to get better. They use the app on a phone, in deliberate-practice mode — running through hands, studying EV trade-offs, building discard intuition between real games. Some sessions are five minutes; some are an hour. The common thread is that the user is here on purpose, not killing time.

A secondary use is mid-game scoring lookups: a hand is dealt at a real table, they want to confirm a count quickly without breaking the social flow of the game.

## Product Purpose

A fast, mobile-first cribbage companion with two surfaces:

1. **Scorer** — input a hand + cut card, get the canonical point breakdown. Trust replaces argument at the table.
2. **Trainer** — repeated discard drills with deterministic EV feedback and a running efficiency score, so the player moves from "I think this is the best discard" to "I know it is."

Success looks like: the user opens the app weekly, gets through 5–10 hands per session in the Trainer, and watches their efficiency climb. Over time, the choices that used to require the trainer become reflex at the real table.

## Brand Personality

Playful, modern, focused. The energy of a study tool that knows what it's for — friendly enough to come back to, sharp enough to be useful. References: Duolingo's micro-feedback loop without the cartoon mascots; Raycast's one-task-per-screen discipline; Arc Search's willingness to be a little opinionated.

Voice: direct, second person, no jargon padding. "Discard 2 to the crib" — not "Please select two cards to be placed in the crib." Numbers and outcomes do the talking; copy stays out of the way.

## Anti-references

- **Cheesy casino / Vegas aesthetic.** No green felt textures, no gold gradients, no ornate filigree borders, no dice-and-chips iconography. This is a study tool, not a slot machine.
- **Childish mobile game.** No cartoon mascots, no bubble buttons with chunky drop shadows, no rainbow gradients celebrating taps. Playful does not mean infantilizing.
- **Brutalist / experimental.** No raw HTML look, no monospace-everywhere, no harsh black borders as a statement. The app should feel considered, not provocative.
- **Generic SaaS dashboard.** No identical card grids, no hero-metric template, no navy-and-gradient nav bars. This is a personal companion, not a B2B tool.

## Design Principles

1. **One task per screen.** Discard, or see results — never both at once. The Trainer's two-phase flow (pick → reveal) is the model: a clean decision space, then a clean feedback space, never mixed.
2. **Feedback over decoration.** Motion, color shifts, and celebration appear only when tied to a real signal — got the optimal play, efficiency ticked up, a new hand is ready. Nothing animates for its own sake.
3. **Card-game heritage, restrained.** Serif ranks (Playfair / Georgia) and tactile playing-card surfaces honor the source material. No felt, no green baize, no skeuomorphic ornament beyond what a real card actually has.
4. **Mobile-thumb-first.** Primary actions sit in the bottom third of the screen and respect safe-area insets. The sticky dock pattern is canonical: hand is always reachable, results scroll above it.
5. **Earn the player's trust through math.** EV is deterministic — same six cards always produce the same optimal play. The app commits to one best discard per hand; it does not hedge, soften, or list "options." Confidence is the product.

## Accessibility & Inclusion

- WCAG AA contrast across light and dark themes. Already documented inline in the theme tokens; preserve when adding new surfaces.
- Tap targets ≥44×44 px for any interactive element on mobile.
- Honor `prefers-color-scheme` (already implemented). Consider honoring `prefers-reduced-motion` for the card lift / drawer animations when new motion is introduced.
- Suit colors must not be the only signal for suit identity — the suit glyph itself (♠♥♦♣) is always visible alongside any red/blue tinting, so color-blind users are not blocked.
