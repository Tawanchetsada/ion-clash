# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

A working Next.js 16 codebase. Phases 0–2 are done: tooling + CI, the pure chemistry domain, and all 50 levels of data. No UI beyond a placeholder page yet.

`development-plan/` is the working plan — 12 phases, each with entry/exit conditions. **Read `development-plan/README.md` for current phase status and `development-plan/00-decisions.md` (D-01 … D-21) before making any architectural choice**; those decisions are already settled and carry their reasoning. When a phase's implementation is finished, record what actually happened — including deviations — in that phase's `NN-phase-*.md`.

| Path | Role |
|---|---|
| `docs/Ion_Clash-frontend-requirements_spec.md` | **Source of truth.** 907 lines, Thai. Routes, state machine, data schema, chemistry rules, save format, tests, acceptance criteria. |
| `docs/Ion_Clash-Website_UI.pdf` | 12-page UI reference; co-equal source of truth for layout and visuals. |
| `docs/chemistry-review.md` | **Generated** by `npm run gen:review` — never hand-edit. The sign-off sheet for the advisor (D-01). |
| `development-plan/` | Phase plans, decision log, open questions. |
| `docs/assets/card file/*.pptx` | Physical card-deck artwork (see Chemistry content inventory). |
| `docs/assets/card-image/reactant/` | 30 exported PNGs, GUID filenames, no manifest. Design reference only — per D-19 cards are drawn as React components, not from these files. |

When the spec and the UI PDF conflict, the spec ranks chemistry correctness and the Acceptance Criteria above visual fidelity.

## Commands

All four must pass before any commit — this is the project's Definition of Done:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

| Command | Purpose |
|---|---|
| `npm test` | Vitest, single run |
| `npx vitest run src/data/levels.test.ts` | One test file |
| `npx vitest run -t "กฎ 9"` | Tests matching a name |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright (chromium + webkit; iPad 1024×768, desktop, mobile 390×844) |
| `npm run gen:review` | Regenerate `docs/chemistry-review.md` from live level data |
| `npm run dev` | Dev server |

`typecheck` runs `next typegen` first on purpose: Next 16's ambient types (e.g. `LayoutProps`) live in `.next/types`, so plain `tsc --noEmit` fails on a clean checkout where `build` hasn't run.

**Lockfile trap, hit twice already.** Adding a dependency incrementally on Windows (`npm install --save-dev x`) prunes Linux-only optional deps (`@emnapi/*`) from `package-lock.json`, and CI then dies at `npm ci` with `Missing: @emnapi/runtime from lock file` while everything passes locally. After touching any dependency:

```bash
rm -rf node_modules package-lock.json && npm install && npm ci --dry-run
```

## What the product is

A frontend-only Thai-language learning game for Grade 10 chemistry: 50 levels, each a double-displacement precipitation reaction between two `(aq)` reactants. The player dissociates reactants into ions, arranges product ions, balances coefficients, cancels spectator ions, and reaches the net ionic equation. No backend, no accounts — progress lives in `localStorage`.

All user-facing text, including `aria-label`s for chemical formulas, is Thai.

## Architecture

Read spec sections "สถาปัตยกรรม Frontend", "State Machine ของเกม", "แบบจำลองข้อมูล 50 ด่าน", and "ระบบบันทึกความก้าวหน้าบนเครื่อง" before writing code. The load-bearing decisions:

**Three separated layers.** `src/domain/` (pure chemistry + game logic, no React), `src/data/` (ions, compounds, 50 levels as typed data), `src/components/` (dumb rendering). Components emit events; they never validate chemistry themselves. `IonSlot` accepts a placement, it does not decide whether the placement is chemically right.

The domain boundary is enforced, not merely documented: an ESLint `no-restricted-imports` block scoped to `src/domain/**` bans `react`/`next`, and `src/domain/chemistry/architecture.test.ts` scans the filesystem to prove it — and to prove `solubility.ts` is the only file in `src/` that ever assigns `phase: "s"`.

**What exists today.** `src/domain/chemistry/` holds `ions` (22 ions per D-02), `solubility` (11 ordered rules — rule order is load-bearing; see its header comment), `formula`, `compounds` (criss-cross), `balance` (brute force 1–12, throws rather than guessing), `reaction` (cross-exchange + D-03 pairing validation), `spectators`, `netIonic` (two-stage reduction). `src/data/` turns a 4-field `LevelSeed` into a fully computed `BuiltLevel` — never hand-write derived chemistry into the seed file.

**Structured data is the only source of truth for chemistry.** Charge, atom counts, phase, and spectator matching all read from typed fields (`ionId`, `charge`, `phase`, `count`). Formula strings like `"Ca(NO₃)₂"` are presentation only and must never be parsed to make a validation decision. Spectator matching pairs on `speciesId + charge + phase + count`, per instance — not by comparing rendered text.

**Ion instances, not ion types.** Each card in an equation carries a unique `instanceId` alongside its `ionId`, because coefficients produce repeated ions that must be dragged, matched, and cancelled independently.

`instanceId` must be **derived deterministically from level data** (D-21) — never `crypto.randomUUID()`, never a render-order counter. Checkpoints persist slot assignments by `instanceId`, so rebuilding level *N* must reproduce byte-identical ids or mid-level resume silently restores nothing. The chemistry domain deliberately does *not* know about instances: it works in `IonTerm` (`ionId` + `count` + `phase`), and instances are layered on above it.

**The game is a finite state machine**, not a pile of booleans. States: `levelSelect → levelIntro → dissociateReactants → arrangeProductIons → balanceEquation → validateProducts → cancelSpectatorIons → netIonicResult → levelComplete`. Note these nine machine states collapse into the **5-step** progress indicator the UI shows throughout play — the two counts are intentionally different.

**Storage goes through one adapter interface.** `GameSaveRepository` (load / save / reset / exportJson / importJson) backed by `LocalStorageAdapter` under the versioned key `ion-clash:save:v1`. No component may touch `window.localStorage` directly — the abstraction exists so a Cloud Save adapter can land in Phase 2 without touching the game reducer. Save data is validated at runtime (Zod or equivalent) on every load; corrupt JSON is preserved to `ion-clash:save:corrupt:<timestamp>` rather than discarded, and storage failures must degrade to an in-session play-through with a warning, never a crash.

**Checkpoints store semantics, not pixels.** Mid-level resume saves slot assignments, coefficients, and cancelled pairs by id. Never persist drag coordinates, DOM ids, or animation state.

**Levels are data, not components.** 50 records with stable ids 1–50; ids are the identity used by save files, so they must not be renumbered when the data file is reordered. All 50 are validated by a single test loop in CI. Never build per-level components.

**Scoring is configuration.** All point values live in `src/config/scoring.ts` so researchers can retune after the pilot study without touching components.

## Chemistry content inventory

The physical deck in `docs/assets/card file/` was the starting point, but **the web deliberately diverges from it** (D-02, D-16). The shipped registry is 22 ions in `src/domain/chemistry/ions.ts`: 12 cations (Na⁺, K⁺, NH₄⁺, Ag⁺, Ca²⁺, Mg²⁺, Cu²⁺, Fe²⁺, Ba²⁺, Pb²⁺, Fe³⁺, Al³⁺) and 10 anions (NO₃⁻, Cl⁻, Br⁻, I⁻, OH⁻, SCN⁻, SO₄²⁻, CO₃²⁻, S²⁻, PO₄³⁻).

Dropped from the deck: **O²⁻** (cannot exist in water — hydrolyses to OH⁻ instantly), **MnO₄²⁻** (not in the Grade 10 syllabus, unstable), **CN⁻** (acutely toxic, its precipitates are off-syllabus). Added: Pb²⁺, Ba²⁺, I⁻, Br⁻, S²⁻. The printed cards are not being reprinted, so `docs/assumptions.md` must carry the comparison table for the thesis.

**Trap:** every product card in `Ion_Clash_Product_Cards_Simple.pptx` is labelled `(s)`, including freely soluble compounds like NaCl, KNO₃, and NH₄NO₃. The cards denote the pure solid substance, not aqueous solubility. **Do not derive precipitate-vs-aqueous from these files** — `solubility.ts` is the only authority.

All 50 level equations now exist in `src/data/levelSeeds.ts`, drafted from standard Grade 10 solubility rules and **still awaiting the advisor's signature** (D-01, open question A-01). They may be revised; if a compound is swapped out, the level keeps its original `id`.

## Hard prohibitions

From the spec's "ข้อห้ามสำหรับ Agent" — these are the rules most likely to be violated by well-intentioned code:

- Do not invent or guess equations. The 50 levels are drafted and pending sign-off; adding or altering one is a chemistry decision, not a coding decision.
- Do not hand-write derived chemistry into `levelSeeds.ts`. A seed carries `id`, `difficulty`, and the two reactant ion pairs — everything else is computed by `buildLevel()`.
- Do not read `localStorage` in a Server Component or during SSR. Client Components or post-mount effects only.
- Do not gate level access with CSS or greyed-out buttons alone. Locked levels need a real route guard that redirects to `/levels`.
- Do not apply the gold precipitate colour until formula, charge, phase, and balance have all passed validation. Gold is the reward signal for a verified answer.
- Do not build drag-only interaction. Every action needs three paths: pointer drag, tap-card-then-tap-slot, and keyboard (Tab / Enter / arrows / Escape). HTML5 drag-and-drop alone is insufficient on iPad.
- Do not communicate state through colour alone — pair every state with text, an icon, and `aria-live`.
- Do not reveal the correct pairing in error feedback. Error messages state the violated principle (`E-CHARGE`, `E-PAIR`, `E-PHASE`, `E-BALANCE`, `E-RATIO`, `E-SPECTATOR`), never the answer.
