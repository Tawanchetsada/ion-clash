# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This is a **specification and asset repository, not yet a codebase**. There is no source code, no `package.json`, no build tooling, and no git repo. The web app described below has not been implemented — the first coding task here is scaffolding it.

| Path | Role |
|---|---|
| `Ion_Clash-frontend-requirements_spec.md` | **Source of truth.** 907 lines, Thai. Full behavioural spec: routes, state machine, data schema, chemistry rules, save format, tests, acceptance criteria. |
| `Ion_Clash-Website_UI.pdf` | 12-page UI reference; co-equal source of truth for layout and visuals. |
| `Ion_Clash-Proposal.pdf`, `Ion Clash-Presentation.pdf` | Project background and pitch. |
| `card file/*.pptx` | Physical card-deck artwork — the chemistry content inventory (see below). |
| `card-image/reactant/` | 30 exported PNG card renders. GUID filenames, no manifest, several `(1)`/`(2)` duplicates. |
| `card-image/product/` | **Empty** — product card renders were never exported. |

When the spec and the UI PDF conflict, the spec ranks chemistry correctness and the Acceptance Criteria above visual fidelity.

## Commands

None exist yet. The spec's Definition of Done requires that the scaffolded project make all four of these pass:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Set up lint / typecheck / test **before** building any UI — that is step 1 of the handoff instructions. Intended tooling: Next.js App Router + TypeScript strict, Vitest or Jest + Testing Library for unit tests, Playwright for E2E at iPad (1024×768) and mobile (390×844) viewports. Deploy target is Vercel.

## What the product is

A frontend-only Thai-language learning game for Grade 10 chemistry: 50 levels, each a double-displacement precipitation reaction between two `(aq)` reactants. The player dissociates reactants into ions, arranges product ions, balances coefficients, cancels spectator ions, and reaches the net ionic equation. No backend, no accounts — progress lives in `localStorage`.

All user-facing text, including `aria-label`s for chemical formulas, is Thai.

## Architecture

Read spec sections "สถาปัตยกรรม Frontend", "State Machine ของเกม", "แบบจำลองข้อมูล 50 ด่าน", and "ระบบบันทึกความก้าวหน้าบนเครื่อง" before writing code. The load-bearing decisions:

**Three separated layers.** `src/domain/` (pure chemistry + game logic, no React), `src/data/` (ions, compounds, 50 levels as typed data), `src/components/` (dumb rendering). Components emit events; they never validate chemistry themselves. `IonSlot` accepts a placement, it does not decide whether the placement is chemically right.

**Structured data is the only source of truth for chemistry.** Charge, atom counts, phase, and spectator matching all read from typed fields (`ionId`, `charge`, `phase`, `count`). Formula strings like `"Ca(NO₃)₂"` are presentation only and must never be parsed to make a validation decision. Spectator matching pairs on `speciesId + charge + phase + count`, per instance — not by comparing rendered text.

**Ion instances, not ion types.** Each card in an equation carries a unique `instanceId` alongside its `ionId`, because coefficients produce repeated ions that must be dragged, matched, and cancelled independently.

**The game is a finite state machine**, not a pile of booleans. States: `levelSelect → levelIntro → dissociateReactants → arrangeProductIons → balanceEquation → validateProducts → cancelSpectatorIons → netIonicResult → levelComplete`. Note these nine machine states collapse into the **5-step** progress indicator the UI shows throughout play — the two counts are intentionally different.

**Storage goes through one adapter interface.** `GameSaveRepository` (load / save / reset / exportJson / importJson) backed by `LocalStorageAdapter` under the versioned key `ion-clash:save:v1`. No component may touch `window.localStorage` directly — the abstraction exists so a Cloud Save adapter can land in Phase 2 without touching the game reducer. Save data is validated at runtime (Zod or equivalent) on every load; corrupt JSON is preserved to `ion-clash:save:corrupt:<timestamp>` rather than discarded, and storage failures must degrade to an in-session play-through with a warning, never a crash.

**Checkpoints store semantics, not pixels.** Mid-level resume saves slot assignments, coefficients, and cancelled pairs by id. Never persist drag coordinates, DOM ids, or animation state.

**Levels are data, not components.** 50 records with stable ids 1–50; ids are the identity used by save files, so they must not be renumbered when the data file is reordered. All 50 are validated by a single test loop in CI. Never build per-level components.

**Scoring is configuration.** All point values live in `src/config/scoring.ts` so researchers can retune after the pilot study without touching components.

## Chemistry content inventory

The physical card deck in `card file/` defines the intended chemical scope: **10 cations** (K⁺, Na⁺, NH₄⁺, Ag⁺, Ca²⁺, Mg²⁺, Cu²⁺, Al³⁺, Fe²⁺, Fe³⁺), **10 anions** (NO₃⁻, Cl⁻, OH⁻, CN⁻, SCN⁻, SO₄²⁻, CO₃²⁻, MnO₄²⁻, O²⁻, PO₄³⁻), and **50 product compounds**.

**Trap:** every product card in `Ion_Clash_Product_Cards_Simple.pptx` is labelled `(s)`, including freely soluble compounds like NaCl, KNO₃, and NH₄NO₃. The cards denote the pure solid substance, not aqueous solubility. **Do not derive precipitate-vs-aqueous from these files.** Per the spec, solubility must come from expert-vetted values in the level data source.

The 50 vetted level equations do not exist yet. The spec forbids inventing them.

## Hard prohibitions

From the spec's "ข้อห้ามสำหรับ Agent" — these are the rules most likely to be violated by well-intentioned code:

- Do not invent or guess equations to reach 50 levels. Level data requires chemistry-expert sign-off.
- Do not read `localStorage` in a Server Component or during SSR. Client Components or post-mount effects only.
- Do not gate level access with CSS or greyed-out buttons alone. Locked levels need a real route guard that redirects to `/levels`.
- Do not apply the gold precipitate colour until formula, charge, phase, and balance have all passed validation. Gold is the reward signal for a verified answer.
- Do not build drag-only interaction. Every action needs three paths: pointer drag, tap-card-then-tap-slot, and keyboard (Tab / Enter / arrows / Escape). HTML5 drag-and-drop alone is insufficient on iPad.
- Do not communicate state through colour alone — pair every state with text, an icon, and `aria-live`.
- Do not reveal the correct pairing in error feedback. Error messages state the violated principle (`E-CHARGE`, `E-PAIR`, `E-PHASE`, `E-BALANCE`, `E-RATIO`, `E-SPECTATOR`), never the answer.
