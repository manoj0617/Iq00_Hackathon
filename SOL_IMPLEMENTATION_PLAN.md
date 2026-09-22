# Storage Intelligence — web demo implementation plan

Status: direction changed by the user to a presentation demo. This plan supersedes the native Android plan archived at `docs/source/superseded-native-plan.md`. Original attachments remain narrative references; their native execution requirements no longer apply.

## 1. Deliverable

A polished, mobile-first browser demo of the full workflow:

Request → inspect constraints → build plan → inspect evidence → adjust selection → confirm simulated cleanup → updated demo inventory → follow-up question.

Build a working simulation with consistent state, not static screenshots. Use React, TypeScript, Vite, shared CSS tokens, Vitest for domain checks and Playwright for browser acceptance. Pin compatible versions at bootstrap. No Android SDK, Kotlin, Compose, Room, emulator, device permissions or real file deletion is required. The baseline needs no backend, credentials or model service.

Keep the Android-inspired utility design. Mobile fills the viewport; desktop centers a readable app surface without a decorative phone frame.

## 2. What is real and what is simulated

| Capability | Implementation | Presentation |
|---|---|---|
| Inventory | Typed seed records, persisted in browser storage | Demo inventory; actual demo-state refresh timestamp |
| Interpretation | Bounded parser plus editable constraints | Demo interpretation; do not claim live model inference |
| Duplicate evidence | Fixture-declared identical-content groups | Fixture evidence; no claim of hashing phone files |
| Planning | Real deterministic filtering, retention, protection and unique-byte totals | Selection and shortfall respond to user edits |
| Review | Real individual/group selection and confirmation | Simulate cleanup |
| Cleanup | Remove selected records from demo state | No device files affected |
| Verification | Compare before/after records and rebuild groups | Removed from demo; simulated space reclaimed |
| Follow-up | Query current demo inventory | Remaining copies come from updated state |

Use a quiet persistent “Demo mode · Sample files” indicator. Reinforce it at evidence, confirmation and results. Do not imitate an Android system permission dialog, invent an observed free-space delta, or call the bounded parser AI. A future real model integration needs an explicit provider decision and secure credential handling; it is outside baseline scope.

## 3. Dataset and correctness rules

Seed realistic student metadata under Documents/College/Sem1, Documents/College/Sem2, DCIM/Camera and Download. Include more than 1 GB of removable illustrative logical bytes, BEE lab-record copies across Sem1/Download, protected duplicates and one ambiguous filename suggestion. Do not create or download gigabytes of real content.

Use decimal units: 1 GB = 1,000,000,000 bytes. Derive every count and total from unique IDs and current state; never maintain independent screen totals.

Mandatory rules:

- Protection wins over every candidate category.
- Retain at least one active member of every fixture duplicate group globally, even when the retained member matches Sem1.
- Count and remove overlapping candidates once.
- Never add old downloads or another scope to meet the target without an explicit edit.
- Ambiguous matches start unselected and require inclusion.
- Fixture duplicate equivalence does not mean removal is safe or desired.
- Deselecting below target shows shortfall. Explicitly confirmed partial cleanup is allowed; automatic scope expansion is not.
- Cancel changes no inventory; double submission cannot apply an operation twice.
- Plans are bound to an inventory revision. Reset or another tab changing it requires rebuilding.
- Reset restores the seed and clears only this app's versioned storage key and demo activity.

## 4. Supported intent

Hero request: “Free at least 1 GB. Keep my Semester 2 files and DCIM/Camera photos. Start with exact duplicates and Semester 1 material.”

Support different MB/GB targets, duplicate-only cleanup, Sem1 cleanup, explicit Sem2/Camera protections and the BEE duplicate follow-up. Chips use these supported requests. Parse bounded phrases and scope aliases; unsupported language or negation must not silently become the hero plan. Show unresolved wording and editable constraints. Keep the original request visible and preserve explicit priority order.

Parsed Intent offers target, protection and priority editing. Removing protection is an explicit edit followed by rebuilding. An unresolved phrase must not silently erase other recognized protections. Baseline semantic evidence is folder membership or labeled filename heuristics, not claimed document understanding.

## 5. Screens

1. Home: dominant query, examples, current demo inventory summary and discreet reset control.
2. Parsed Intent: editable target/protection/priority, parser disclosure and unresolved phrases.
3. Plan: selected total/target/shortfall and evidence groups with non-overlapping totals.
4. Detail: retained/removed duplicate copies, fixture evidence and file-specific scope reasons.
5. Final Review: selected files, protected scopes, retained copies and Simulate cleanup.
6. Confirmation: accessible in-app dialog explaining the demo-state change; cancel works.
7. Result: files removed from demo, simulated logical space reclaimed, protection/retention checks, updated index and follow-up.
8. Storage: simple current inventory; Activity: plain events, added after the critical path.

Optional presenter controls may inject labeled simulated partial failure or unavailable access after the core flow passes. No fake OS permission flow or artificial long scanning animation.

## 6. Architecture and Sol ownership

Use pure domain functions and one application state owner. Avoid backend/provider frameworks or crash-recovery machinery.

Shared contracts: `DemoFile` (ID, path/name, logical bytes, type/date, duplicate-content key); `DemoInventory` (schema version, revision, active records); `Intent` (request, target, protections, ordered scopes, unresolved terms, interpretation source); `Evidence` (kind, basis, fixture provenance, review requirement); `CleanupPlan` (revision, candidates, protected/retained/selected IDs and derived totals); `CleanupResult` (operation ID, removed IDs/bytes, before/after revisions and invariant checks); `DemoState` (inventory, workflow and activity).

Persist validated demo data under a versioned app-specific key. Incompatible/corrupt saved data produces a visible reset explanation. Reload restores inventory and a safe starting route; it never resumes an unconfirmed cleanup.

| Sol owner | Owned files | Deliverables |
|---|---|---|
| Integrator | package/build config, src/App.tsx, src/main.tsx, src/contracts/, src/state/, docs/, browser tests | Bootstrap, contracts, composition/navigation, persistence/reset, final acceptance |
| Domain agent | src/domain/ and matching unit tests | Bounded parser, evidence resolution, planner, selection invariants and follow-up |
| Data/simulation agent | src/data/, src/simulation/ and matching tests | Seed, consistent fixture groups, pure cleanup/reconciliation and reset inputs |
| UI agent | src/ui/, src/styles/ | Shared theme/components, responsive screens and interaction states bound to contracts |

All implementation agents use Sol as requested. After contract freeze, three streams run alongside the integrator. Shared changes go through the integrator; agents preserve other streams' edits. One integrator-owned `docs/IMPLEMENTATION_STATUS.md` holds commands, outcomes, blockers and compact handoffs.

## 7. Sequence

1. Bootstrap the app/test runner and freeze shared models, seed schema and theme.
2. Parallelize domain, fixture/simulation and UI implementation against the contracts.
3. Integrate a small complete path immediately: request → constraints → plan → simulated removal → result.
4. Finish evidence detail, selection, persistence, reset, follow-up and unsupported-input handling.
5. Verify browser behavior and visual layout; rehearse from reset twice.
6. Add optional scenarios or polish only after baseline acceptance.

The previous 30-hour native schedule is superseded. No Android toolchain or physical-phone gate blocks this work. Hosting is a separate action when requested.

## 8. Acceptance

Domain tests prove global protection/retention, overlapping candidates counted once, target arithmetic, shortfall after deselection, explicit priority, no unrequested downloads, ambiguous matches unselected, safe unsupported/negated input, cancellation, stale-plan rejection and idempotent simulation.

Browser acceptance: run the hero request; inspect/edit constraints; open duplicate and Sem1 detail; deselect files/groups and confirm totals; cancel and prove no inventory change; simulate and verify only selected IDs disappear while protected/retained IDs remain; ask the BEE follow-up and verify current copies; reload to verify persistence; reset to restore the seed.

Inspect at 360px, 390px and desktop widths, long filenames, 200% zoom, keyboard/focus behavior, dialog focus return and reduced motion. No console errors, overflow, hidden actions, dead controls or unlabeled simulated recovery.

Done means a locally runnable demo, passing focused tests/build/browser checks, start/reset instructions and two repeatable walkthroughs. It does not establish actual Android file access, on-device inference, phone-file hashes, real deletion or measured physical recovery.

## 9. Dispatch prompt

> Implement your assigned Sol stream from SOL_IMPLEMENTATION_PLAN.md. This is a React/TypeScript browser simulation. Read PRODUCT.md, DESIGN.md, shared contracts and implementation status. Stay within ownership; coordinate shared changes with the integrator. Derive all runtime numbers from current state, enforce protection/retention and label simulated evidence/actions accurately. Test behavior and report commands, results and limitations. Do not add Android tooling, real storage access, a remote model or a backend.
