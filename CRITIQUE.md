# Cribbage Helper — Critique & Hardening Findings

A full quality pass on the app as of commit `a608a42`. Findings are tagged
**Critical / High / Medium / Low**, each with a one-line rationale. The
prioritized fix list (impact × effort) is at the end.

---

## 0. What the app is (restated, to confirm understanding)

A mobile-first cribbage **companion** for serious players who already know the
rules and want to get better. Two working surfaces plus two stubs:

- **Trainer** (default): deals 6 cards, you pick 2 to discard, it grades your
  discard against the EV-optimal keep, draws a cut, scores your hand (and your
  crib when you're dealer), and tracks a running **efficiency %** across the
  session and over time. This is the heart of the product: deliberate-practice
  discard drills with deterministic feedback.
- **Scorer**: build a hand + cut card by hand, get the canonical point
  breakdown. For settling counts at a real table.
- **History**: per-day efficiency, a 14-day sparkline, lifetime/7-day stats,
  persisted to `localStorage`.
- **Settings**: stub ("coming soon").

Core value = **trust through math**: one best discard per hand, explained, and a
score breakdown that teaches *why* each point was earned. Explainability is the
product, not a garnish.

Stack: React 19 + Vite 8, plain JavaScript (no TypeScript), ESLint flat config.
All styling is inline style objects driven by a JS theme (`makeTheme`). No test
runner, no typecheck step, no CI. `npm run build` and `npm run lint` both pass
clean.

---

## 1. Product & concept

**P1 — The "helper" job is genuinely well served, but trust is undercut by
correctness bugs. [High]**
The Trainer's pick→grade→reveal loop is exactly right for the stated user, and
the score breakdown's "which cards scored" sub-line is a real teaching device.
But see §2: a scoring bug (his-heels counted in every hand) and a labeling bug
(every multi-pair shown as "four of a kind") directly attack the one thing the
product sells — trust. Rationale: a helper that miscounts or mislabels is worse
than no helper.

**P2 — EV is presented as exact but the crib half is sampled. [Medium]**
`PRODUCT.md` promises "EV is deterministic — same six cards always produce the
same optimal play." It *is* deterministic (stride sampling, no RNG), but it's an
approximation of the true crib EV, and nothing in the UI says so beyond a small
"Estimates for random opponent discards & cut" line. For a tool whose pitch is
"confidence is the product," the hand EV is exact while the crib EV is ~15
samples/cut — worth either making exact (it's cheap enough) or labeling honestly.

**P3 — No explanation of *why* a discard is optimal. [Medium]**
The grade tells you *that* you were off and by how much EV, and the expandable
table shows per-keep numbers, but there's no plain-language "why" (e.g. "keeping
4-5-6 holds a run and flush potential"). The numbers do a lot, but the stated
brand voice ("explain why, not just emit a number") isn't fully met for discards.

**P4 — Settings is a dead end; rules variants are referenced but absent. [Low]**
Nav advertises "Rules variants & preferences" but Settings is a stub. Minor, but
it sets an expectation the app doesn't meet.

**P5 — No onboarding / first-run framing. [Low]**
A new user lands directly in the Trainer mid-deal with no explanation of
efficiency, dealer vs. crib, or what "EV" means. Acceptable for the "already
knows the rules" audience, but a one-line primer would raise trust.

---

## 2. Cribbage correctness (Critical by mandate)

**C1 — "His heels" (2 for a cut jack) is counted in every hand and crib. [Critical]**
`scoreNibs(starter)` adds 2 to *any* hand whose cut is a jack, and it's wired
into `scoreHand` unconditionally — so it applies to the pone's hand, to the crib,
and to the manual Scorer.
Verified: `scoreHand([2♠,4♥,6♦,8♣], J♥)` returns **2** with a "His Nibs" row.
Per standard rules, "his heels" is a **dealer-only peg taken at the moment of the
cut**, before play — it is *not* part of the show / hand count. Counting it in
the show is wrong for the pone, wrong for the crib, and wrong for a generic hand
scorer that has no dealer context. It also inflates Trainer hand-EV across the
board (every jack cut adds 2 to every option). Rationale: a flatly incorrect
scoring rule in the engine that sells correctness.
(Note: naming is also off — the engine calls the cut-jack rule "His Nibs"; the
standard term is "his heels"/"his nob is the dealer's"; "his nobs" is the
*in-hand* jack matching the cut suit, which the engine separately gets right.)

**C2 — Pair grouping mislabels two pairs / trips+pair as "four of a kind". [High]**
`scorePairs` sums all pair points then picks a single label from the *count of
pairs*: 1→"Pair", 3→"Pair Royal", else→"Double Pair Royal (4 of a kind)".
Verified: two distinct pairs (5,5,6,6) → one row "Double Pair Royal (4 of a
kind) +4"; trips+pair (5,5,5,6,6) → one row "Double Pair Royal (4 of a kind)
+8". Totals are correct; the **explanations are wrong** (two pairs is not four of
a kind; trips+pair is "three of a kind" + "pair"). It also collapses distinct
groups into one row, defeating the teaching sub-line. Rationale: the breakdown is
the product's value and it's actively misinforming.

**C3 — Impossibility guards: currently pass on a sample, but unguarded. [High]**
A 300k random hand+cut scan produced no 19/25/26/27 — good — but there is **no
test** asserting it, and C1's stray +2 means the engine's output is not the pure
"show" count the impossibility theorem describes. Rationale: untested invariant on
the exact property a cribbage engine must guarantee.

**Correctly implemented (verified):** fifteens (all subset sizes), runs including
double/triple/quad via per-size combo enumeration with the correct "longest run
only" break, 4-card vs 5-card flush with the crib "must be 5" rule, his-nobs
(in-hand jack matching cut suit), and the canonical **perfect 29**
(`5♥5♠5♣J♦` + `5♦` → 29). Ace is correctly low-only (no K-A wrap in runs).

**C4 — Flush edge: `scoreFlush` trusts `hand4` length implicitly. [Low]**
`scoreFlush` reads `hand4[0]?.suit` and `.every`, so a 3-card array would
"flush" on 3 matching suits. Today it's only ever called with 4 cards, but it's
an unguarded precondition that a future caller could violate. Rationale: latent,
not currently triggered.

---

## 3. Architecture & code health

**A1 — Dead / unused exports in the engine. [Medium]**
`bestKeep`, `evHand`, `evCrib`, and `handStats` are exported but unused anywhere
(`analyzeHand` superseded `bestKeep`; the EV wrappers are unreferenced). Dead
surface area to maintain and test. Rationale: low effort to remove, reduces
confusion.

**A2 — Unused assets and empty file shipped. [Low]**
`src/assets/{hero.png,react.svg,vite.svg}`, `public/icons.svg`, and an empty
`src/App.css` are unreferenced. Rationale: cruft, trivially removable.

**A3 — Engine domain logic is well-separated; UI is not. [Medium]**
`engine.js` is cleanly decoupled (pure functions) — good. But the *theme* is a
240-line `makeTheme` living in `App.jsx` with a full second set of "legacy alias"
tokens duplicating every canonical token; `App.jsx` also holds the entire Scorer
screen inline. Rationale: the theme and Scorer should be their own modules.

**A4 — `TrainerScreen` carries 16 `useState` hooks. [Medium]**
Discard/score results are 8+ separate, tightly-coupled state slices
(`feedback`, `optResult`, `handResult`, `cribResult`, `optHandResult`,
`allOptions`, `kept`, `discarded`, `cut`…) all set together in `confirmDiscard`.
This is a single "round result" object begging to be one `useReducer` or one
state object. Rationale: error-prone (easy to forget to reset one), hard to read.

**A5 — `t` (theme) is prop-drilled through every component. [Low]**
Every component takes `t`. A `ThemeContext` would remove the drilling. Rationale:
cosmetic but pervasive; low risk via context.

**A6 — Duplicated score-row component. [Low]**
`ScoreLogRow` (Trainer) and the inline score row in `App.jsx`'s `ScorePanel` are
near-identical. `MiniCardInline` is also duplicated inline in `ScorePanel`.
Rationale: one shared component avoids drift.

**A7 — Duplicated efficiency math. [Low]**
The `optEV>0 ? min(100, round(your/opt*100)) : 100` formula appears ~6 times
across `TrainerScreen`, `HistoryScreen`, and `useHistory`. Rationale: extract one
`efficiencyPct()` helper.

**A8 — Deck shuffles with `sort(() => Math.random() - 0.5)`. [Low]**
Used in `dealNewHand` and the Scorer's `randomize`. This is a biased shuffle (and
comparator inconsistency is technically UB for `sort`). Fine for casual dealing,
but a Fisher–Yates `shuffle` is the same effort and correct. Rationale: minor
fairness/correctness.

---

## 4. Type safety

**T1 — No TypeScript; the domain is modeled as loose objects. [Medium]**
Cards are `{rank: string, suit: string}` with rank/suit as free strings;
nothing prevents `{rank:"11", suit:"X"}`. `@types/react` is installed but no TS
is in use. The task explicitly wants card/suit/rank/hand modeled as real
types/enums. Rationale: the engine is the place where precise types pay off most,
but a full migration is a large, sweeping change (see plan).

**T2 — `cardValue` relies on `parseInt` for face ranks. [Low]**
`parseInt("J")` is `NaN`; guarded by the `J/Q/K` check above it, so safe today,
but a typed `Rank` union would make it provably total. Rationale: latent.

---

## 5. UX & design

**U1 — Playing cards are not keyboard- or screen-reader-accessible. [High]**
`CardFan` renders each card as a bare `<div onClick>` — no `role`, no `tabIndex`,
no key handler, no `aria`. The discard selection (the primary Trainer
interaction) is mouse/touch-only. The DESIGN.md component spec itself shows
`role="button" tabindex="0"`; the implementation dropped it. Rationale: the core
action is unusable without a pointer; fails WCAG 2.1.1.

**U2 — Card remove "✕" is a tiny nested interactive in a button. [Medium]**
In `CardPill`, the remove `✕` is an 11px `<span onClick>` *inside* a `<button>`
(invalid nesting) with a tap target far below 44×44. Rationale: a11y + valid-HTML
issue on a frequently used control.

**U3 — Theme toggle is opaque. [Medium]**
The button always shows "☀" regardless of state, `aria-label` is a static
"Toggle theme" (doesn't announce current/next state), and there's no persistence
— a manual override is lost on reload and resets to system. Rationale: confusing
affordance + lost preference.

**U4 — Empty/loading/error states are thin. [Medium]**
No loading state while `analyzeHand` blocks (see Perf), no error boundary, and
the Trainer assumes the initial deal always succeeds. History/empty is handled
well; the Trainer and Scorer are not. Rationale: a thrown error in scoring would
white-screen the app.

**U5 — Design-token drift between DESIGN.md and code. [Medium]**
DESIGN.md documents a spacing scale (`sp-1..sp-12`), a radius scale, and a type
scale, but the code uses **raw magic numbers everywhere** (`padding: "10px 14px"`,
`borderRadius: 8`, `fontSize: 13`, dozens of one-off `oklch(...)` literals inside
components like `RankBadge`, `DiscardOptionRow`). The documented scales exist only
on paper. Rationale: the stated design system isn't enforced; values drift.

**U6 — Suit color uses blue, but the system is red/black. [Low]**
`isRed` splits red vs. "blue"; the dark-theme `suitDark` is near-black and the
legacy `blueCard` alias is dark too, so cards read black correctly — but several
comments and the design.json still talk about a "Spade-Club Blue." The naming is
inconsistent with what renders. Suit glyphs are always shown alongside color
(good for color-blind users). Rationale: cosmetic naming debt.

**U7 — Mobile viewport uses `100dvh` well; desktop is solid. [Low/positive]**
Safe-area insets are respected in the dock and top bar; `100dvh` avoids the iOS
URL-bar jump. This is done correctly — noting it so it's preserved.

---

## 6. Performance

**PERF1 — `analyzeHand` runs ~11k `scoreHand` calls synchronously on the main
thread. [High]**
On every discard, `analyzeHand` evaluates 15 keeps × (46 cut scores + stride-
sampled crib ≈ hundreds) on the UI thread, then `confirmDiscard` does several
more `scoreHand` passes. On a mid-range phone this blocks the main thread and
delays the pick→reveal transition with no progress indication. The task
explicitly calls for heavy compute to run off-thread, cancellable, with progress.
Rationale: jank on the exact moment the product is meant to feel instant.

**PERF2 — `usedKeys`/`hand4`/`result` recomputed every render in `App`. [Low]**
The Scorer recomputes `usedKeys` (a new `Set`) and re-scores on every render;
cheap here, but un-memoized. Rationale: minor, easy `useMemo`.

**PERF3 — Inline style objects allocate on every render. [Low]**
Pervasive `style={{…}}` literals create new objects each render, defeating any
memoization and adding GC pressure. Acceptable at this scale; flagged for
awareness. Rationale: low impact now, compounds as the app grows.

**PERF4 — `combos` is recursive and re-derived per call. [Low]**
`scoreHand` rebuilds combinations for every cut inside the EV loops. Memoizing
fifteen/run subset *shapes* (by rank multiset) could cut the EV cost an order of
magnitude, which also relieves PERF1. Rationale: real speedup, moderate effort.

---

## 7. Testing

**TEST1 — There is no test runner and zero tests. [Critical]**
The scoring engine — the trust core — has no coverage. No `test` script, no
runner. The task mandates a canonical-hands suite (perfect 29, 28, impossibility
guards, double runs, 4- vs 5-card flush, his-nobs). Rationale: an unverified
scoring engine in a correctness-selling product is the single biggest gap.

**TEST2 — No typecheck step. [Low]**
Plain JS, so nothing to run today; becomes relevant only if TS is adopted.

**TEST3 — No CI. [Medium]**
Nothing runs lint/build on push or PR. A lightweight GitHub Action (lint +
build + test) would lock in the gains. Rationale: prevents regressions to the
fixes below.

---

## 8. Prioritized fix list (impact × effort)

Ranked best-first. "Effort" is rough (S/M/L).

### Tier 1 — Correctness & safety net (do first; high impact, low effort)
1. **TEST1**: Add a test runner (Vitest) + scoring suite with canonical hands
   and impossibility guards. *(M)* — needs a dependency, requires sign-off.
2. **C1**: Remove "his heels" from the hand/crib show count; surface it (if at
   all) as a separate dealer-cut peg, not part of `scoreHand`. *(S, bug fix)*
3. **C2**: Fix `scorePairs` to emit correct per-group labels (Pair / Three of a
   kind / Four of a kind, and separate rows for distinct ranks). *(S, bug fix)*
4. **C4 / T2**: Add a precondition guard / typed values so flush & `cardValue`
   are total. *(S)*

### Tier 2 — Structure & trust (high impact, medium effort)
5. **A1 / A2**: Delete dead exports, unused assets, empty `App.css`. *(S)*
6. **A3**: Extract `theme.js` (drop the duplicate legacy-alias token set) and
   pull the Scorer into its own module. *(M)*
7. **A7 / A6**: Extract `efficiencyPct()` and a shared `ScoreRow`/`MiniCard`. *(S)*
8. **U1 / U2**: Make cards keyboard/AT-accessible; fix the remove-button
   nesting and tap target. *(M)*
9. **TEST3 / CI**: Add a lint+build+test GitHub Action. *(S)*

### Tier 3 — Polish & depth (medium impact)
10. **A4**: Collapse Trainer round-result state into one reducer/object. *(M)*
11. **U3**: Persist theme override; make the toggle state-aware + labeled. *(S)*
12. **U5**: Adopt the documented spacing/radius/type scales as real tokens;
    replace magic numbers. *(L)*
13. **U4**: Add an error boundary + a "calculating…" state. *(S/M)*
14. **PERF1 / PERF4**: Move `analyzeHand` to a cancellable Web Worker with
    progress, and/or memoize subset shapes. *(L)*
15. **P2 / P3**: Make crib EV exact (or label it honestly) and add a plain-
    language "why" to the discard grade. *(M)*

### Tier 4 — Larger bets (high effort; propose, don't assume)
16. **T1**: Migrate the engine (and ideally the app) to TypeScript with a
    modeled domain (`Rank`/`Suit`/`Card`/`Hand`). *(L)* — sweeping; needs sign-off.
17. **A8**: Replace `sort(random)` shuffles with Fisher–Yates. *(S, fold into A3.)*

---

*Nothing in Tier 1–2 deletes a feature; items 2–3 are bug fixes and will be
called out as such in commits. Items 1 and 16 add tooling/deps and are gated on
your approval before I apply them.*
</content>
</invoke>
