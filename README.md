# CipherQuest — Stage Proofs of Concept

All four stages from the CipherQuest design doc, built to validate the interaction model
and core math/logic approach before building the rest of the game. Use the stage
switcher at the top of the page to jump between them, and the tier switcher below it to
pick difficulty.

- **Stage 1 — Kunci Akses** (Access Key — visual algebra / substitution)
- **Stage 2 — Pintasan Reaktor** (Reactor Bypass — fractions & percentages)
- **Stage 3 — Peta Ruangan Rahasia** (Secret Room Map — area & perimeter)
- **Stage 4 — Urutan Tuas** (Lever Sequence — deductive logic)

Each stage ships 3 difficulty tiers (Easy / Medium / Hard). Every tier is now fully
randomized per playthrough — see "Randomized content" below.

## Language: English / Bahasa Indonesia, player-selectable

A flag-icon language switcher (🇬🇧 English / 🇮🇩 Indonesia, three buttons below the tier
switcher) lets the player pick per Tofan's request — reading only-Indonesian text felt
off to him, but Indonesian is what removes the "perimeter isn't a word kids use"
problem for the actual target audience, so both are available and the player picks.
**Default is English.** Switching restarts the current Scene with the new language,
same mechanism as switching tiers.

### How localization is wired

Every stage's data file authors two full text sets at once — e.g.
`objective: { en: '...', id: '...' }` — using the `LocalizedText` type
(`domain/types.ts`). The data files themselves are typed as `*StageSource`
(`AccessKeyStageSource`, `ReactorStageSource`, etc.), not the plain-string
`AccessKeyStage`/`ReactorStage`/etc. that Scene and domain-logic files consume.
`domain/localize.ts` is the one place that bridges the two: `getStage1Content(tier,
locale)` (in `data/content.ts`) picks the tier, then resolves that tier's bilingual
source down to a single-language, plain-string stage object via
`resolveAccessKeyStage()` / `resolveReactorStage()` / etc. **Scene and domain-logic
files never see `Locale` or `LocalizedText`** — same "depend only on the shape"
principle the tiered-content seam already established, just one layer earlier.

The one exception: `areaPerimeterLogic.ts`'s `evaluateDimensionChoice()` takes a
`locale` parameter directly, because its `{areaVerdict}`/`{perimeterVerdict}` words
("big"/"small", "long"/"short" vs "besar"/"kecil", "panjang"/"pendek") are *derived* at
evaluation time from which way a wrong answer misses — they can't be pre-authored in a
data file, so they can't go through the resolve-upfront pattern. `SecretRoomScene`
passes `this.locale` through on every call. No other stage's evaluate function needed
this: Stage 1/2's messages don't interpolate any language-bearing word (`{percent}` is
just digits, no unit-word), and Stage 4's `{violatedRules}` interpolates clue `.text`
that's already been resolved to one language by the time `leverLogic.ts` sees it.

Scene-hardcoded strings (titles, default "drag/pick something" prompts, the
"Key unlocked!"/"Mission Complete!" suffixes) aren't part of stage data at all, so they
localize differently: each of the 4 Scene files has its own small
`STRINGS: Record<Locale, {...}>` const, and `init(data: { tier?, locale? })` stores
`this.locale` (default `'en'`) for `create()` to read from it.

### Content policy (language-independent, applies to both EN and ID text)

- **Core math/logic vocabulary keeps its English term in parentheses in the Indonesian
  text only**, on the persistent instructional text a player reads once per stage-load
  (the objective line, Stage 1's query line) — e.g. "Temukan nilai (value)...", "Luas
  (area) = 24 satuan DAN Keliling (perimeter) = 20 satuan", "...pakai logika (logic)
  dari petunjuk...". The English text needs no such gloss — it's already the target
  vocabulary.
- **Transient feedback text** (shown after each attempt, fires repeatedly, disappears)
  stays plain Indonesian without the parenthetical — keeps repeated messages terse and
  readable. The one exception: Stage 2's `concept_error` message keeps "(repeating
  decimal)" every time in Indonesian, since that specific message *is* the stage's core
  "aha" teaching moment (per the design doc: "teaches a deep concept through failure")
  and is worth reinforcing on every occurrence, not just once. (The English version of
  that same message needs no parenthetical, naturally — "Repeating decimal" is already
  English.)
- **Narrative framing over textbook phrasing**, in both languages — objectives read as
  part of the escape-room mission, not a worksheet word problem (Indonesian never uses
  "Diketahui: ... Ditanya: ...", the classic textbook pattern explicitly avoided here).
- Thematic icon/lever labels (Gear/Gir, Battery/Baterai, Red/Merah, etc.) are fully
  localized too — full immersion, not just the instructional sentences.
- Internal-only metadata (`solution.description`, `distractorReason`) stays a single
  mixed/English string, not `LocalizedText` — never rendered to the player, so not
  worth the authoring effort of a second language.
- `App.tsx`'s stage/tier switcher buttons (dev-facing navigation chrome, not in-game
  content) are intentionally left in English regardless of the selected locale.

## Stack

- **React 19** — shell UI only (title, layout); no game state lives here.
- **Phaser 4** — canvas rendering, drag-and-drop input, tweens.
- **TypeScript**, **Vite** — build pipeline.

Nothing else from the doc's suggested stack (Redux/Zustand, Node/Express, Postgres/Redis)
is included — out of scope for a single-stage POC with no persistence or backend.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the production build locally
```

## Architecture

```
src/
├── domain/               # pure TS — no Phaser/React imports, unit-testable
│   ├── types.ts           # Level/Stage/AccessKeyStage/ReactorStage/AreaPerimeterStage/
│   │                       # LeverSequenceStage/FeedbackRule + their bilingual
│   │                       # *StageSource counterparts + Locale/LocalizedText
│   ├── localize.ts          # resolve*Stage(): *StageSource + Locale -> plain-string *Stage
│   ├── rational.ts         # exact fraction arithmetic (the precision fix — see below)
│   ├── linearSystem.ts      # generic n x n solver (Gaussian elimination, exact fractions)
│   ├── reactorLogic.ts      # Stage 2: selection -> feedback condition, content check
│   ├── algebraLogic.ts      # Stage 1: solves equations -> derives the expected answer
│   ├── areaPerimeterLogic.ts # Stage 3: option -> feedback condition, content check
│   │                          # (the one function that still takes `locale` — see "Language")
│   └── leverLogic.ts         # Stage 4: arrangement -> feedback condition, content check
├── domain/generators/       # one generator per stage, each producing a fresh,
│   │                          # solvability-validated *StageSource every call — see
│   │                          # "Randomized content" below
│   ├── generateStage1.ts    # Access Key: builds a sequential-substitution equation
│   │                          # chain, re-solves it via the real solveLinearSystem
│   ├── generateStage2.ts    # Reactor: builds a target from 3 random clean fractions,
│   │                          # brute-force-counts 3-cell matches before accepting
│   ├── generateStage3.ts    # Secret Room: picks a correct dimension pair, generates
│   │                          # near-miss distractors per tier's profile
│   └── generateStage4.ts    # Lever Sequence: random solution order + tier clue quota,
│                              # brute-forces uniqueness and per-clue load-bearing
├── domain/rng.ts            # seedable PRNG (mulberry32) + shuffle/sample/randInt
│                              # helpers used by every generator above
├── data/
│   ├── stage1-access-key-{easy,medium,hard}.ts   # original hand-authored examples —
│   ├── stage2-reactor-{easy,medium,hard}.ts      # no longer imported by content.ts,
│   ├── stage3-secret-room-{easy,medium,hard}.ts  # kept as reference material (the
│   ├── stage4-lever-sequence-{easy,medium,hard}.ts # generators' constraints were
│   │                                                # lifted from these — see below)
│   └── content.ts            # getStageNContent(tier, locale) — the one seam Scenes call
│                              # through per stage (see "Randomized content" and "Language")
├── game/
│   ├── config.ts             # Phaser.Game config (registers all scenes)
│   ├── PhaserGame.tsx         # React <-> Phaser bridge + scene-switching handle
│   └── scenes/
│       ├── AccessKeyScene.ts     # Stage 1: equations + on-screen numeric keypad
│       ├── ReactorBypassScene.ts # Stage 2: drag input, reads from domain/
│       ├── SecretRoomScene.ts    # Stage 3: 4-option multiple choice, reads from domain/
│       └── LeverSequenceScene.ts # Stage 4: drag levers into position slots
│           # each Scene file also has its own small STRINGS: Record<Locale, {...}>
│           # for its own hardcoded strings (title, default prompt) — see "Language"
├── App.tsx     # stage switcher + tier switcher + language switcher UI
└── main.tsx
```

The split matters: `domain/` has zero rendering dependencies, so the math/logic and
feedback-condition judgment can be tested (or reused by a future stage) without
touching Phaser at all. Stage 1's expected answer is *derived* from its equations via
`linearSystem.ts`, and Stage 4's solution is *derived* from its clues via brute-force
permutation search — neither is hardcoded, so a content author editing the puzzle can't
leave a stale answer behind. Same anti-drift principle as Stage 2's and Stage 3's
content checks.

## Randomized content ("Opsi A" — full per-playthrough randomization)

Every stage generates a **fresh puzzle on every call**, not a fixed pick from 3 static
variants. The seam is unchanged from the original tiered-content design — one entry
point per stage in `data/content.ts`:

```ts
getStage1Content(tier: DifficultyTier, locale: Locale): AccessKeyStage    // tier = 'easy' | 'medium' | 'hard', locale = 'en' | 'id'
getStage2Content(tier: DifficultyTier, locale: Locale): ReactorStage
getStage3Content(tier: DifficultyTier, locale: Locale): AreaPerimeterStage
getStage4Content(tier: DifficultyTier, locale: Locale): LeverSequenceStage
```

— but each now calls that stage's generator in `domain/generators/` with a fresh
`createRng()` (no seed ⇒ real randomness) instead of indexing into a
`Record<DifficultyTier, ...>` of hand-authored files. `AccessKeyScene`/
`ReactorBypassScene`/`SecretRoomScene`/`LeverSequenceScene` still just call the getter
in `init()` and never know content is generated rather than static — this is the same
"depend only on the shape" seam the original tiered-content design and the language
layer were already built around, which is exactly why swapping the implementation
needed zero Scene or domain-logic changes. Because `init()` re-runs on every
`scene.start()` (stage switch, tier switch, *or* language switch — see "Switching tiers"
below), re-selecting the same stage/tier is itself a "new puzzle" action; no separate
reroll button was added.

**Solvability is validated at generation time, not assumed.** Each generator retries
(generate-and-reject, capped at 200-500 attempts) until its stage-specific invariant
holds, checked against the same domain-logic the game runs at evaluation time — never
hand-derived separately:

- **Stage 1** (`generateStage1.ts`) builds a sequential-substitution equation chain
  (`2·v1 = c1`, `v1+v2 = c2`, ... — never real simultaneous algebra, since the target
  age group can't do elimination) from random constants, then re-solves it through the
  actual `solveLinearSystem` + `Rational` code and rejects unless the result is a
  unique, all-positive, all-distinct integer solution. Easy/Medium: 3 icons, addition
  only. Hard: 4 icons, adds one subtraction step.
- **Stage 2** (`generateStage2.ts`) picks 3 random "clean" (terminating-decimal)
  fractions as the solution, sums them for the target, adds distractor clean cells plus
  1-2 non-terminating distractor cells, then brute-force-counts every 3-cell combo among
  the non-distractor cells and rejects unless exactly one sums to the target exactly —
  the same combo-enumeration check the original hand-authored tiers were checked with,
  just run automatically. Hard draws from an eighths-heavy pool (less-obvious fractions)
  with 2 distractors instead of 1.
- **Stage 3** (`generateStage3.ts`) picks a random correct `(width, height)`, derives the
  target area/perimeter, then generates distractors matching each tier's near-miss
  profile: Easy gets one distractor of each wrong-answer type (area-only /
  perimeter-only / both-wrong); Medium and Hard get 2 area-only + 1 perimeter-only, with
  Hard preferring the numerically closest near-misses (harder to eyeball) — the same
  distractor-type distribution the original hand-authored tiers happened to use.
- **Stage 4** (`generateStage4.ts`) picks a random lever subset and a random solution
  order for it, generates true clues about that order at the tier's clue-kind quota
  (Easy: before + not_position only; Medium: adds one `gap` clue; Hard: adds a second
  `before` and scales to 4 levers), then brute-forces every permutation (cheap at 3-4
  levers) to confirm exactly one arrangement satisfies every clue **and** that every
  clue is load-bearing (removing any single one breaks uniqueness) — the same
  authoring-quality bar the hand-authored tiers were held to (see "Stage 4 — verified"
  below).

Cross-checked with an automated harness (not part of the build): 300 generations ×
3 tiers × 4 stages = 3,600 puzzles, each independently re-verified solvable by running
the real `evaluate*`/`solve*` functions against the generated content (not just trusting
the generator's own internal check) — zero failures. Also live-tested in-browser across
every stage, every tier, and both languages via actual keypad/drag/click interaction.

Reactor `requiredCellCount` stays 3 across all tiers — `ReactorBypassScene`'s insert
slots (`INSERT_SLOT_ANGLES_DEG`) are hardcoded to 3 positions, so Hard adds difficulty
via pool size (6 cells, 2 distractors) and less-obvious fractions (eighths), not more
required cells. Stage 3 stays at 4 dimension options across all tiers for the same
reason (`SecretRoomScene`'s option grid is a fixed 2×2 layout); Hard adds difficulty via
closer near-misses instead of more options. Stage 4 *does* scale slot/lever count (3 in
Easy/Medium, 4 in Hard) since `LeverSequenceScene`'s slot layout is computed from
`stage.levers.length`, not hardcoded — the one stage where the difficulty knob and the
rendering are both fully generic.

Switching tiers *or* switching language restarts the current Scene via `scene.start()`
(both go through the same `{ tier, locale }` data object), which Phaser reuses the same
Scene *instance* for — `ReactorBypassScene.create()` now explicitly resets
`cellSprites`, `insertedOrder`, and `locked` at the top for this reason (destroyed
game-object references and a stale `locked=true` would otherwise survive a restart);
this was latent in the single-tier version since the stage switcher already exercised
repeated `create()` calls on the same instance, tiers (and now language) just make it
common. Live-verified: switching language mid-puzzle (before answering) correctly
clears the in-progress Stage 4 arrangement and redraws with the new language's lever
labels and clue text.

A live-testing pass on the Reactor stage also caught a real, pre-existing display bug:
`ReactorBypassScene`'s "Critical Capacity Required" header read
`stage.targetPercentage.numerator` directly, which only equals the percent when the
fraction is stored unreduced over `/100` — true of every hand-authored tier's literal
`{ numerator, denominator: 100 }`, but not of a generator-computed target, since summing
via the `Rational` class always auto-reduces (a 75% target reduces to `3/4`, so
`.numerator` read `3`, not `75`). Fixed in `ReactorBypassScene.ts` to derive the label
from `Rational.fromValue(...).toPercentLabel()` instead of assuming the raw numerator is
the percent — the correct fix regardless of where the data comes from, not a
generator-specific workaround.

## The fraction-precision fix

The design doc's own data model (`PowerCell.actualValue: number`) stores each cell as a
float — e.g. `0.333...` for 1/3. Summing floats risks the classic `0.1 + 0.2 !==
0.3` problem: a combo that's mathematically exactly 90% could sum to
`89.99999999999999` and get wrongly flagged as underload.

Fix: `RationalValue { numerator, denominator }` plus a small `Rational` class
(`src/domain/rational.ts`) that does all arithmetic as reduced integer fractions via
`gcd`. A float only appears once, at display time, when converting to a percent label.
`sum.equals(target)` is an exact integer comparison, not an epsilon check.

This also powers `validateReactorContent()` — a dev-only assertion that a cell's
`isDistractor` flag agrees with a computed check ("does this fraction terminate in base
10?"), so a future content author can't silently mismark a cell.

## Original hand-authored examples (illustrative — not live content)

The sections below document the verification pass done on the *original* hand-authored
tiers, back when `data/content.ts` picked one of 3 static files per stage. That content
is no longer what players see at runtime (see "Randomized content" above — every puzzle
is generated fresh), but the walkthroughs stay useful as concrete worked examples of
each stage's mechanics and feedback states, and the Stage 4 section documents a real
design-doc correction that's still load-bearing knowledge for anyone touching
`leverLogic.ts` or `generateStage4.ts`.

## Verified feedback states (all 4, from the Medium tier's 5 cells — no data changes needed)

| Combo | Sum | State |
|---|---|---|
| A(1/2) + C(1/5) + D(20%) | 90% | **correct** |
| A + B(1/4) + C, or A + B + D | 95% | **overload** |
| B + C + D | 65% | **underload** |
| any combo including E(1/3) | — | **concept_error** (always wins, even over a numeric overload/underload reading — the lesson is "this cell is unstable," not "this cell happens to also be too much") |

## Stage 1 — verified

Correct answer (14, from Gear=6/Battery=4/Disk=8) and the wrong-answer path both
confirmed via the on-screen keypad in **both languages**: English ("Values not
synchronized. Re-check the Battery value." / "Access Granted. Key unlocked!") and
Indonesian ("Nilai belum sinkron. Cek ulang nilai Baterai." / "Akses Diberikan. Kunci
terbuka!"), including switching language mid-session (buffer/lock correctly reset, see
"Switching tiers *or* switching language restarts..." above). Input is a custom keypad,
not the native keyboard — more reliable on mobile/canvas and consistent with Stage 2's
no-native-input approach.

## Stage 3 — verified

Unlike Stage 1/2, area and perimeter are always plain integers (no `Rational` needed —
there's no fraction-summing precision risk here), so `areaPerimeterLogic.ts` just does
`width * height` / `2 * (width + height)` directly.

The verdict words substituted into `{areaVerdict}`/`{perimeterVerdict}` are generated
inside `evaluateDimensionChoice()` in `areaPerimeterLogic.ts` per the `locale` argument
it's called with ("big"/"small", "long"/"short" vs "besar"/"kecil", "panjang"/"pendek")
— see "Language" above for why this one function needed a `locale` parameter when
nothing else in `domain/` did.

All 4 outcome states confirmed live on the Medium tier (the design doc's own example,
target Area=24/Perimeter=20) in **both languages**:

| Option | Area | Perimeter | State | Message (EN) | Message (ID) |
|---|---|---|---|---|---|
| 8 × 3 | 24 ✓ | 22 ✗ | **area_only_correct** | "Area correct (24), but Perimeter = 22. Too long!" | "Luas benar (24), tapi Keliling = 22. Terlalu panjang!" |
| 6 × 4 | 24 ✓ | 20 ✓ | **correct** | "Area = 24, Perimeter = 20. Floor opens!" | "Luas = 24, Keliling = 20. Lantai terbuka!" |
| 12 × 2 | 24 ✓ | 28 ✗ | area_only_correct | (not separately screenshotted — same code path as 8×3) | |
| 5 × 5 | 25 ✗ | 20 ✓ | **perimeter_only_correct** | confirmed on the Easy tier's 2×5 option, EN: "Perimeter correct (14), but Area = 10. Too small!" | ID: "Keliling benar (14), tapi Luas = 10. Terlalu kecil!" |

`both_incorrect` (neither matches) exercises the same `evaluateDimensionChoice` branch
as the other two wrong states, verified by code inspection rather than a fourth
screenshot — all three wrong branches build their message the same way, just with
different placeholders filled in.

## Stage 4 — verified, with a correction to the design doc's own worked example

`leverLogic.ts` models each clue as one of 3 generic kinds — `before(subject, object)`,
`not_position(subject, position)`, `gap(a, b, gap)` where `gap` means "exactly `gap`
levers physically sit between a and b" (so `gap: 1` ⇒ `|pos(a) − pos(b)| === 2`) — and
judges a full arrangement by checking every clue at once, same pattern as the other
three stages' evaluate functions.

**The correction:** the design doc's Section 5 Stage 4 states the answer as
Blue=1/Red=2/Yellow=3, but that arrangement does not satisfy the doc's own clue 3
("there is exactly 1 lever between Red and Blue") under the literal reading — positions
1 and 2 are adjacent, with 0 levers between them, not 1. Brute-forcing all 6
permutations of {Red, Yellow, Blue} against the doc's 3 clues as literally worded gives
a *different*, genuinely unique solution: **Blue=1, Yellow=2, Red=3** (Red and Blue sit
at positions 1 and 3, exactly 1 lever — Yellow — between them). The Medium tier's data
file encodes this corrected solution, not the doc's prose. (The doc's stated answer only
works under a looser, unstated reading of clue 3 as "positions differ by 1," which is a
different clue than the one written down — a plausible way to have arrived at it by
hand, but not what the text says.) Recorded in this project's `CLAUDE.md` under
"Corrections on record," alongside the earlier Stage 2 review-table mislabeling.

Live-verified in-browser for all 3 tiers via drag-and-drop, in **both languages**:

| Tier | Language | Arrangement tried | Result |
|---|---|---|---|
| Medium | ID | Merah,Kuning,Biru (the doc's literal prose order) | **incorrect** — violates clue 1 (Blue before Yellow) and clue 2 (Red not first); both violated levers highlighted red, message lists both clue texts |
| Medium | ID | Biru,Kuning,Merah (corrected solution) | **correct** — all 3 slots turn green, "Semua tuas turun bersamaan. Brankas terbuka!" |
| Medium | EN | Blue,Yellow,Red (corrected solution) | **correct** — "All levers descend together. Vault opens!" |
| Easy | ID | Hijau,Oranye,Ungu | **correct** |
| Hard | EN | Green,Blue,Yellow,Red | **correct** — confirms the drag-and-drop mechanics survived the `LeverSequenceStageSource` refactor unchanged (lever `id`s never localized, only `label`/`text`) |

Also confirmed: `validateLeverSequenceContent`'s brute-force dev assertion (exactly 1
arrangement satisfies every clue) passes for all 3 tiers without a console warning, and
the violated-lever highlighting correctly targets only the levers named in a violated
clue (all 3 in the Medium wrong-answer case above, since between them the two violated
clues reference every lever).

## Episode 1 narrative pilot (2026-09-25)

Per the design doc's v3.0 update (episodic narrative, ECHO companion, season arc —
see `Qwen_markdown_20260925_6wcixx7ue_v3.md` and its continuation in this repo's parent
folder), the smallest slice that can test the doc's core hypothesis ("do kids care about
saving ECHO?") before investing in the full companion/season-arc infrastructure: the 4
existing stages, wrapped in Episode 1 — "The Ghost in the Machine" — with 3 fixed
narrative beats (hook / reveal / cliffhanger), no per-stage commentary, no branching, no
relationship score. See this project's `CLAUDE.md` for the fuller build-vs-not-yet-build
reasoning.

- **Flow**: intro screen (tier picker + Start) → ECHO hook dialogue (shown over Stage 1,
  already loaded, dimmed behind it) → play all 4 stages in sequence, each followed by a
  "Continue →" prompt once solved → ECHO reveal dialogue (shown over the just-solved
  Stage 4 board) → cliffhanger (Shadow Figure teaser) → end screen → Play Again.
  `data/episode1.ts` authors the 3 beats bilingually (`DialogueLineSource[]`, same
  `LocalizedText` pattern as stage content); `domain/localize.ts`'s `resolveDialogue`
  resolves to plain strings, same seam as `resolve*Stage`. `game/DialogueOverlay.tsx` is
  the reusable click-to-advance box.
- **Stage-complete signal**: each Scene now does one extra thing on a correct solve —
  `this.events.emit('cipherquest:stage-complete')` — a generic "I'm done" event, not
  narrative-aware, so the Golden Rule (Scene depends only on stage-data shape) still
  holds. `PhaserGameHandle.switchStage` takes an optional callback wired to that event;
  `App.tsx`'s episode state machine uses it to know when to show "Continue".
  Dev mode (the original free stage/tier/locale switcher, now behind a "Dev: pick a
  stage manually" toggle at the bottom of the page) is unaffected — it never passes this
  callback.
- **Bug found and fixed while testing this**: a DOM overlay (dialogue box, "Continue"
  button, intro/end screen) sitting on top of the Phaser canvas does **not** stop clicks
  from also reaching whatever game object is underneath it at the same screen position.
  Root cause: Phaser's `InputManager` also listens for `pointerup` on `window` (so a drag
  released outside the canvas still registers), and that listener hit-tests by raw screen
  coordinates against the active scene's display list — it doesn't consult the DOM at
  all, so it doesn't know the actual click target was a different element. Confirmed via
  `getScenes(true)` logging: right after `switchStage` calls `scene.start()`, the new
  scene isn't in the "active" list yet (booting is deferred to the next game step), so an
  `e.stopPropagation()`-based fix in the overlay's own handler doesn't reach it in time
  either. The fix that actually holds: `PhaserGameHandle.setInputEnabled(enabled)`,
  called from an `App.tsx` effect keyed on "is any narrative overlay currently covering
  the canvas", sets `.input.enabled` on **every** scene via `getScenes(false)` (not
  `(true)`) — since all 4 scenes are pre-instantiated at game boot (`config.ts`'s static
  `scene: [...]` list), this reaches even a scene that's still mid-boot, unlike the
  active-only list. Verified in-browser: 3 taps on the hook dialogue no longer leak
  digits into Stage 1's keypad underneath it.
- **Not built yet, deliberately**: per-stage ECHO commentary, companion relationship
  score, dialogue branching, `localStorage`/backend persistence of episode progress —
  all Phase 2+ in the design doc, out of scope until this pilot's actual playtest
  (§7.1/7.2 in the design doc: does a real 10-12-year-old care about saving ECHO, and do
  they want to keep going) says it's worth the investment.

## Known risks

- **Fraction precision** — solved architecturally (see above), not just tested around.
  Forward-looking caveat: `Rational` uses plain JS numbers; denominators from chained
  additions across many terms could in principle exceed safe-integer range in a much
  larger future level. Not a concern at this stage's scale (3 cells, small
  denominators) — would need `BigInt` if that changes.
- **Mobile drag-and-drop** — Phaser's pointer events unify mouse/touch, but real risks
  are (a) iOS Safari contending with the canvas for scroll/gesture, (b) touch-target
  size for small fingers, (c) no forgiveness for an imprecise drop. Applies to both
  Stage 2 (cells into reactor) and Stage 4 (levers into slots). Recommend a
  tap-to-toggle fallback (tap item, then tap target) as a Beta addition — more robust
  for young kids than precision dragging, and not required for this POC.
- **React + Phaser lifecycle** — React 18/19 StrictMode double-invokes effects in dev;
  `PhaserGame.tsx` guards game creation with a ref so a second `Phaser.Game` isn't
  spawned. Must be applied consistently as more scenes/bridges get added.
- **Bundle size** — Phaser is ~1.6 MB unminified-equivalent (433 KB gzip) even though
  this POC uses a small fraction of its features (no physics, no spritesheets). Worth
  revisiting with dynamic `import()` / code-splitting now that all 4 scenes are
  registered up front in `config.ts` regardless of which one is active.
- **Content-authoring drift** — mitigated by dev-time assertions: `reactorLogic.ts`'s
  `validateReactorContent` (catches the terminating-decimal case),
  `areaPerimeterLogic.ts`'s `validateAreaPerimeterContent` (catches a tier not having
  exactly one dimension option matching both targets), and `leverLogic.ts`'s
  `validateLeverSequenceContent` (brute-forces every arrangement, catches a clue set
  with zero or more than one solution). Note what this class of check *can't* catch:
  Stage 4's `LeverSequenceStage` — like Stage 1's `AccessKeyStage` — never stores an
  authored "solution" value that evaluation checks against; the solution is always
  *derived* from the clues, so there's no separate field that could silently disagree
  with them. That's why the design doc's Stage 4 discrepancy (see above) wasn't a
  runtime bug waiting to happen — it was a documentation/prose error that a
  brute-force pass at authoring time caught before it became one. Stage 1 has no
  separate assertion for the analogous reason: `solveLinearSystem` returning `null`
  already throws at evaluation time for an unsolvable system.
- **Missing-translation drift** — not really a risk: `LocalizedText = Record<Locale,
  string>` means a data file missing either the `en` or `id` key for any text field is
  a TypeScript compile error, not a runtime gap discovered by a player switching
  language. `npx tsc -b` catches it before `npm run build` even runs.
- **Any future DOM-over-Phaser UI must call `setInputEnabled(false)`** — see "Episode 1
  narrative pilot" above for the click-leak bug this caused and why. Applies to any new
  React overlay (a settings modal, a pause menu, a future companion-hint bubble), not
  just dialogue.

## Roadmap

- **MVP (this POC)** — all 4 stages, placeholder visuals (colored rectangles/grid, no
  art or audio), no persistence. Tiered, fully-randomized content ("Opsi A", see
  "Randomized content" above) done for all four. English/Indonesian language switcher
  done for all four. Episode 1 narrative pilot (hook/reveal/cliffhanger around the 4
  stages, see "Episode 1 narrative pilot" above) done — pending a real playtest before
  deciding whether to build Episode 2 and the heavier companion/season-arc system from
  the v3.0 design doc.
- **Beta** — tap-to-toggle input fallback for Stage 2/4's drag-and-drop, real art/audio
  pass, `localStorage` progress, parent-dashboard skeleton.
- **v1.0** — backend + auth for cross-device progress sync, analytics events for the
  "thinking pattern" parent dashboard, additional levels/themes, native wrapper
  (Capacitor or React Native) for app-store distribution.
