# Storage Intelligence: Sol implementation plan

Status: revised implementation handoff after critical review; no application code implemented.
Prepared from the two supplied workflow and product-design documents, 22 September 2026.
Initial workspace inspection found no application code. No build or device capability has been verified.
Execution budget: provisionally 30 hours, as introduced by the review; this is a planning assumption, not a confirmed deadline or delivery estimate.

## 1. Objective and recommended direction

Deliver one real Android vertical slice:

Intent → validated constraints → indexed candidates → evidence → editable review → approved action → reconciliation → measured result.

Hero request: “Free at least 1 GB. Keep my Semester 2 files and DCIM/Camera photos. Start with Semester 1 material and exact duplicates.”

Recommend Kotlin, Jetpack Compose, Room, coroutines, and Android storage APIs. This is an architectural recommendation, not an existing stack. A web mockup cannot establish Android permission, deletion, persistence, or recovery behavior. Select compatible dependency versions during bootstrap and commit them together with the Gradle wrapper.

Use decimal units consistently: 1 GB = 1,000,000,000 bytes. Store integer bytes; round only for display.

## 2. Critical corrections to the supplied documents

| Issue | Implementation decision |
|---|---|
| Old downloads appear in plans although absent from the hero request | Do not silently add them. Offer an explicit scope expansion only if needed. Age threshold must be visible and defined when that feature is added. |
| Prompt order and illustrated priority order differ | Show the proposed order in Parsed Intent and require confirmation. For the scripted demo, explicitly choose duplicates first, then Sem1. Preserve explicit user ordering in other requests. |
| Sem1 cleanup could remove the duplicate group's retained copy | Retention is a global exclusion across every category and execution batch. Protected members are preferred retained copies. Never select all accessible copies of a proven group. |
| The same file can match several categories | One canonical item identity and one selected-byte contribution. Preserve multiple evidence reasons, but assign one display bucket. |
| “PROVEN” could imply safe to delete | It means byte-identical content only. UI must not imply importance, safety, or user intent is proven. |
| Filename resemblance is presented close to folder certainty | Folder membership, filename heuristics, and model inference are separate evidence types. Ambiguous matches start unselected and require explicit inclusion. |
| Trashing is conflated with freeing space | Track trash and permanent deletion separately. Do not promise immediate recovery from trash. For the recovery demo, prove supported permanent deletion on disposable fixtures. |
| Selected bytes are treated as actual recovery | Display selected logical bytes, verified deleted logical bytes, and independently measured free-space change separately. Measurement unavailable is a valid result. |
| “Protected unchanged” appears unconditional | Only claim verified unchanged for inspected protected content after comparison. Inaccessible/unverifiable protection has a distinct status. |
| “Starred files” appear only in the UI document | Defer favorites/starred support; omit the promise until a real source and enforcement exist. |
| WhatsApp labels imply provenance | Use “Repeated accessible media” unless provenance is established. No private WhatsApp database inspection. |
| GB totals differ between examples | All numbers are illustrative. Every runtime total comes from one selected-item set. No screen-specific constants. |
| “Index updated 2 min ago” implies background maintenance | Report the actual last successful refresh and coverage. Initial indexing and refresh-on-demand are sufficient; continuous monitoring is deferred. |
| “Cleanup complete” hides partial/cancelled operations | Support cancelled, partial, failed, verifying, verification incomplete, complete/target met, and complete/target unmet outcomes. |

## 3. Scope

Required: persistent accessible-file inventory; metadata; streamed SHA-256 duplicate proof; folder scope resolution; natural-language interpretation; deterministic planner; protection and retention enforcement; file/group selection; supported action; persistent action journal; re-index; honest result.

Home, Parsed Intent, Plan, Evidence detail, Final Review, and Result form the critical path. Storage is a compact inventory; Activity reads the execution journal. They are not separate feature platforms.

First executable slice uses one user-granted local Documents subtree for Sem1, Sem2, and duplicate fixtures. MediaStore is a conditional second source, not a prerequisite for deleting document fixtures. To retain the exact hero claim about DCIM/Camera, establish real Camera scope resolution and protection coverage separately; read-only MediaStore access may suffice. If that coverage is unavailable, explicitly narrow the live request to the verified Documents scope and label Camera as outside coverage. Do not create a fake Camera folder inside Documents and claim actual DCIM protection.

Demo-critical: all protection, retention, unique-byte accounting, approval, preflight freshness checks, partial/cancelled outcomes, and reconciliation rules remain mandatory. Reduce provider and feature breadth to make them affordable.

Later hardening: automated interrupted-operation recovery, general provider alias resolution, broad device/provider compatibility, background maintenance, and exhaustive accessibility/device configuration testing. Minimum accessibility (legibility, labels, touch targets, text scaling) remains in the demo.

Evidence levels are explicit: verified folder membership can drive the requested Sem1 scope; filename rules produce review-required suggestions; model-assisted classification is optional and also review-required. A filename such as `M1_Previous_Papers.pdf` does not establish the user's semester without contextual mapping. The core AI role is interpreting the request, not inferring arbitrary coursework from a name.

Deferred until the core passes on a phone: content extraction, embeddings, broad semantic search, old-download policy, starred files, automatic cleanup, private-app analysis, full-phone claims, cloud storage, scheduled indexing, elaborate logo/motion, and arbitrary conversational follow-ups.

Optional follow-up: answer the BEE-lab-record duplicate question from the refreshed index; report accessible indexed coverage, not global absence across the phone.

## 4. Gate 0: prove feasibility before parallel implementation

One Sol integrator owns this gate.

1. Record the test phone model, Android/API version, available local storage, build SDK/JDK, and installation path. Do not infer the device from the workspace name.
2. Create a minimal native app and use disposable local files only.
3. Prove a persisted SAF grant to a supported Documents subtree and access after app restart.
4. Prove read, hash, supported deletion, cancellation, and post-action existence checks. Document the provider's actual behavior.
5. Prove only the MediaStore capabilities required by the selected demo: read/protection coverage for actual Camera claims, and deletion/confirmation only if media deletion is included. Keep source scopes disjoint instead of building general alias reconciliation.
6. Prove before/after free-space measurement for the same local volume as the deleted files. Record unavailable/unsupported measurements rather than synthesizing them.
7. Choose the actual intent model/provider and run the hero prompt through structured-output validation. Record latency, connection requirements, and failure behavior. Never embed a provider secret in the APK. If no model is configured, an explicitly labeled limited parser may unblock development, but it does not satisfy the AI demonstration gate.

Android restricts broad tree selection: the Download root cannot simply be granted with ACTION_OPEN_DOCUMENT_TREE on Android 11+. Use supported individually selected documents or a verified selectable subtree, or keep initial fixtures in the granted Documents tree. Do not silently claim full Downloads access.

Gate output: one compact `docs/IMPLEMENTATION_STATUS.md` containing device capabilities, source/claim decisions, architecture/contracts, ownership, commands and evidence; plus a compiling/installable skeleton with pinned dependencies. If an essential storage path fails, revise the demo scope before dispatching dependent work. Model feasibility runs early alongside this work; a blocked provider does not block storage/UI implementation against the interpreter port, but remains an explicit AI-demo blocker with an owner and cutoff time.

## 5. Freeze shared contracts

Integrator owns `core/model/`, `core/contracts/`, root build files, app composition, navigation routes, and manifest. Agent changes to these require a coordinated contract revision before consumers change.

Use a single app initially with package ownership rather than many Gradle modules. Suggested source root: `app/src/main/java/<package>/`; choose the package during Gate 0.

Core records:

- `IndexedItem`: canonical identity, source kind, content URI, granted-root identity, relative ancestry where established, display name, MIME type, nullable logical bytes/modified time, scan generation, access capabilities, hash and hash validity fingerprint.
- `DerivedEvidence`: item identity, evidence kind (folder/filename/model), basis, rule or model version, source fingerprint/generation, and review requirement. Keep semantic labels out of `IndexedItem`; the previous plan already did so, and this record makes evidence lifetime explicit. Invalidate evidence when its source or derivation changes.
- `IndexSnapshot`: generation, roots and coverage, start/end times, items, unreadable items, scan errors. A scan error is not proof a file was deleted.
- `DuplicateGroup`: complete-content SHA-256, size, distinct canonical members, designated retained member, proof generation. Hash only readable local content; prefilter by size and stream data off the UI thread.
- `ParsedIntent`: original request, target bytes, resolved protection roots, proposed ordered candidate scopes, unresolved terms, parser provenance. The model proposes scope identifiers; it cannot supply arbitrary executable paths or deletion instructions.
- `Plan`: ID/revision, snapshot generation, validated intent, unique candidates, evidence, retained identities, protected identities/scopes, selected identities, selected bytes, shortfall, and blockers.
- `Approval`: exact plan revision and selected item identities plus displayed action type. Any rule/selection/content change invalidates the affected approval.
- `ActionJournal`: operation ID, approved revision and selected identities persisted before side effects; per-item requested/deleted/failed/cancelled/unknown outcomes with minimal timestamps/diagnostics. Plan and approval already have their own records; do not duplicate a full workflow engine in the journal. `unknown` is essential for interrupted or inconclusive actions. No automatic replay engine in the demo.
- `VerificationResult`: confirmed deleted bytes, observed free-space delta and volume/timestamps, protection comparison, retained-copy status, refreshed generation, target result and verification limitations.

Ports: inventory scan/refresh, content hashing, intent interpretation, pure plan building, action capability/execution, and verification. UI consumes state and dispatches commands; it never calls deletion APIs directly.

Data flow is two converging branches: indexed facts → derived evidence, and user request → validated intent. Both feed the deterministic planner, followed by review → approved action → reconciliation. Intent parsing need not wait for a full evidence scan; resolving its scope references does require known storage coverage.

Unknown size is not zero recovery. Unknown ancestry cannot establish protection compliance: exclude such candidates until resolved. A provider URI is authoritative identity; display paths are not filesystem authority. Avoid raw substring prefix checks, URI-string path guessing, and counting the same content object through two providers. If aliasing cannot be resolved, restrict the demo to disjoint source scopes.

## 6. Safety and state invariants

1. Protection wins over target, category, model output, and user selection toggles.
2. Duplicate retention applies to the entire plan, including Sem1 and later scope expansions.
3. Ambiguous/model-assisted matches remain unselected until explicitly reviewed.
4. Only actionable, fresh, accessible candidates contribute to the executable selection total.
5. Every screen derives totals from the same unique selected set.
6. Insufficient space yields a visible shortfall, never an automatic scope expansion.
7. Immediately before action, revalidate grants, identity, content freshness, protection and retention. Rehash changed/uncertain duplicate evidence; validate the retained member still exists. Block stale plans for rebuilding/review.
8. Confirmation results alone are not deletion proof. Reconcile existence and provider state; inability to read can mean permission loss.
9. Execute sequentially within an operation; disable double submission. On restart mark unresolved requested actions as unknown, block further cleanup until a fresh scan and a newly reviewed plan, and do not replay deletion requests. An interrupted operation may remain verification-incomplete. Automated recovery is deferred.
10. Cancellation and partial completion preserve per-item outcomes. Android/provider batches are not assumed transactional.
11. Index changes publish a coherent generation; the UI must not combine old duplicate groups with new item totals.
12. Raw filenames/document content are untrusted data. A model never overrides these invariants. Do not upload document bodies in the core demo; specify any metadata leaving the device.

State flow: idle → interpreting → intent needs resolution/ready → planning → plan review → final review → action pending → executing/system confirmation → reconciling → result. Include back/edit behavior, model timeout, denied grants, stale plans, and interrupted execution explicitly.

## 7. Three Sol streams and one integrator

All implementation agents use Sol. Ownership includes matching tests. Keep bounded milestones and file ownership, but use three continuous streams rather than six separate handoffs. The integrator owns shared changes and the single status document. No stream edits another owner's files without reassignment.

| Owner | Owned area | Milestones and exit condition |
|---|---|---|
| Integrator | Bootstrap, `core/model/`, `core/contracts/`, build, manifest, app composition/navigation, `tools/demo/`, `docs/` | Gate 0; shared contracts; continuous integration; actual-phone acceptance and fixture reset. |
| S — Storage/system | `data/index/`, `platform/storage/`, `domain/cleanup/`, `data/activity/` | S1: persistent inventory, hashes and refreshed groups. S2: approval-bound execution, small journal, reconciliation and measurement. Same owner carries adapters through deletion to avoid a late handoff. |
| I — Intent/planner | `domain/intent/`, `domain/evidence/`, `domain/planner/` | I1: folder evidence and pure protection/retention planner. I2: validated real interpreter, review-only filename evidence if useful. Early provider feasibility is coordinated with the integrator. |
| U — Product/UI | `ui/theme/`, `ui/components/`, `ui/screens/` | U1: complete review flow against contracts. U2: real state binding through integrator composition, failure states and phone visual checks. No direct deletion or duplicate business logic. |

After Gate 0 and contract freeze, S/I/U run in parallel within four total slots including the integrator. S2 consumes the approved plan contract; start its journal/coordinator skeleton before S1 is fully polished. Integrate a small real-file slice early, then expand fixture size. Never wait until all screens are complete to connect storage.

UI fixtures are clearly marked development-only. Runtime success uses real repositories exclusively. Contract revisions, blockers, evidence and short stream handoffs live in `docs/IMPLEMENTATION_STATUS.md`; the integrator updates it from agent reports, avoiding concurrent edits and extra coordination files.

### Provisional 30-hour schedule and cut lines

Elapsed hours represent parallel work windows, not summed effort or guaranteed completion.

| Window | Required outcome |
|---|---|
| 0–3 | Phone access/deletion proof, minimal build, source selection, model feasibility probe, shared contracts. If no physical phone is available, continue pure logic/UI but explicitly mark physical-demo feasibility blocked. |
| 3–8 | S: persistent inventory/hashing; I: folder evidence and safety planner; U: Home → Intent → Plan → Review → Result skeleton. Decide the model route by hour 6; a limited parser remains visibly limited. |
| 8–14 | Integrate a small real dataset end to end, including actual interpreter when available, deletion, re-index and result. Test global retention before increasing fixture size. |
| 14–20 | Complete journal/reconciliation, critical negative tests and 1 GB fixture. No optional semantic work while this slice is failing. |
| 20–24 | Phone UI/accessibility checks, provider failure handling, measurement labels, repeatable reset and first full rehearsal. Add optional classification/follow-up only if the acceptance gates already pass. |
| 24–30 | Feature freeze; repair core defects and perform two complete rehearsals. Reserve this window for verification rather than new features. |

Cut first: optional semantic assistance, filename suggestions, follow-up query, Activity polish, secondary inventory screens, then unused provider adapters. Never cut protection, retention, explicit review, unique totals, truthful outcomes or basic stale-plan rejection. If the live model remains unavailable, label the result a deterministic workflow demo rather than presenting a rule parser as AI. If the deadline is different, resize these windows before dispatch.

## 8. UI acceptance brief

Scene: a student reviews potentially destructive cleanup on an Android phone, then presents the same flow under bright judging-room lighting. Prioritize legibility, control, and short deliberate scrolling.

Use the supplied light utility direction: near-white neutral surfaces, dark text, one blue interaction accent, native sans typography, green for factual success, amber for review, neutral protection labels. Keep text/icon labels alongside color. Define exact contrast-tested tokens once in the theme; avoid dynamic theming that changes the demo unexpectedly.

- 16dp screen margins; 12–16dp card gaps/radii; at least 48dp touch targets.
- One shared evidence chip, file row, metric treatment, protection row, and action bar. No nested decorative card grids.
- Home query dominates; show actual index coverage and freshness. “Reviewable” is omitted until its calculation is defined.
- Parsed Intent exposes unresolved roots and proposed ordering; building is blocked until required constraints resolve.
- Plan distinguishes selected bytes from additional unselected suggestions. Deselecting below target shows a shortfall immediately.
- Duplicate detail shows retained/removed members, size and truncated hash with access to full evidence; no AI decoration.
- Final Review names the actual action, selected count/bytes, retained copies and protected scope. Permanent deletion must be identified plainly.
- Result shows partial and unavailable states as first-class outcomes, not universal green success.
- Result hierarchy: confirmed deleted file count → confirmed deleted logical bytes → observed device free-space change. Keep requested target and selected estimate as context. Report logical deletion versus target separately from observed free-space change versus target; neither a missing measurement nor a logical total proves the requested physical space was recovered.
- Support long filenames, large font settings, screen-reader labels/focus, keyboard/inset handling, and system Back through confirmation return.
- Use 150–250ms state transitions where useful; respect reduced-motion/device settings. No fake scanning, animated success inflation, or count-up implying measured progress.

UI acceptance requires screenshots and interaction checks on the actual Android layout. A successful Compose preview or build is insufficient.

## 9. Demo acceptance versus later hardening

Pure domain tests:

- Protected Sem2/Camera member also matches duplicate and Sem1 categories: never selected.
- Retained Sem1 duplicate also matches Sem1 scope: remains retained.
- Same item in multiple groups: counted and executed once.
- Identical filename/different bytes: not proven duplicates.
- Missing hash, unreadable file or unknown bytes: cannot inflate proven recovery.
- Target unavailable; empty selection; deselection below target; exact byte threshold; large byte counts.
- Sem1 vs Sem10 ancestry, unresolved protection, hostile model output, unsupported requested operation and malformed model response.
- Old downloads absent from user scope: never silently included.

Demo-critical platform/integration checks (exercise actual selected providers on the phone; use controlled adapter tests for difficult failure injection):

- Grant persists after restart; revoked grant blocks action and produces honest coverage.
- File changes after planning; retained member disappears; provider reports errors.
- Cancel confirmation where the selected provider requires it; cancel the app's review flow in all cases. Fail one item in a multi-item operation and test repeated taps.
- Interrupt one operation and reopen: unresolved outcomes are visible, no action is replayed, and further cleanup requires refresh and a newly reviewed plan. Automatic continuation and extensive crash timing coverage are deferred.
- Verify no unapproved identity was actioned and journal outcomes reconcile correctly.
- Trashed files do not automatically count as recovered physical space.
- Re-index persists after restart; follow-up uses the refreshed generation.

Deferred hardening matrix: many process-death timing points, automatic recovery, multiple overlapping provider identities, broad OEM/API coverage, remote document providers, background execution and exhaustive accessibility configurations. Deferral does not permit success claims for untested states. Basic denied-access, stale-plan, cancellation and partial-result behavior stay mandatory because ordinary demo interactions can trigger them.

Real demo fixture:

- Use disposable local Sem1/Sem2/Camera fixtures and byte-identical duplicate copies. No personal content deletion.
- Prepare enough actual removable data above 1 GB with rehearsal headroom; do not hardcode the resulting total.
- Keep a manifest of fixture identities, sizes and SHA-256 values, including protected sentinels and retained copies.
- Before/after compare protected manifest entries and retained copies, independently from the UI's assertions.
- Reset only explicitly designated disposable fixtures; verify resolved reset targets before removal. Keep pristine source assets outside cleanup scope.
- If realistic old timestamps cannot be set by the provider, report actual metadata and omit age claims.

Acceptance: two consecutive real-phone runs from a documented reset complete the core workflow, preserve all protected fixture hashes/identities and retained copies, show accurate per-item outcomes and totals, refresh persistently, and report actual free-space observations. Record duration against the 2.5–3.5 minute presentation target; initial full indexing happens before the presentation and is disclosed.

Evidence must distinguish build, unit, instrumented, model/provider, emulator, real-device, visual, and measured-recovery checks. A missing category stays unverified. A free-space delta is an observation affected by other device activity, not an exact causal byte counter; never clamp or replace it with selected bytes.

## 10. Reusable dispatch prompt

> Implement stream <S/I/U>, milestone <1/2>, from SOL_IMPLEMENTATION_PLAN.md using Sol. Read this plan, docs/IMPLEMENTATION_STATUS.md when present, and the shared contracts before editing. Inspect workspace changes; preserve work owned by others. Stay within your stream's named file ownership and the current milestone. Apply demo-critical acceptance checks; do not implement deferred hardening or optional features to fill time. Coordinate shared model, dependency or manifest changes with the integrator. Do not use fixture values as runtime facts or claim checks that did not run. Report changed files, consumed contracts, exact verification commands/results, limitations and the dependency unlocked. Send the integrator a compact handoff for the single status document.

The integrator dispatches milestone 2 only when its prerequisites are ready, and owns the final acceptance report. No separate contract-change log or per-packet handoff files are required.

## 11. Decisions to resolve at implementation kickoff

- Exact phone/API version and whether a physical device is available immediately.
- Intent model/provider, credentials delivery, connectivity and privacy constraints; local index does not imply local model inference.
- Actual approved storage roots and whether the demo needs MediaStore beyond a SAF-based core.
- Confirm the native Android recommendation if a web-only demonstrator was intended; that would change the evidence and claims materially.
- Confirm the proposed 30-hour budget and presentation constraints; the review's event/deadline framing has not been independently established.

These questions do not block this plan. Gate 0 resolves storage/device constraints before downstream commitments; model/provider feasibility is tracked early with the hour-6 decision cutoff.

Claim policy: say “on-device AI” only after real inference runs on the target phone. For a remote model, say “local storage index + AI-assisted intent layer” and disclose the transmitted request/metadata and network dependency. Without a working model, say “limited deterministic intent parser.” No deck changes have been made here; the presenter must align the deck with the implemented route.

## 12. Review disposition

Accepted: distinguish demo correctness from production hardening; shrink provider breadth and journal machinery; prioritize confirmed outcomes on Result; formalize derived evidence; simplify coordination to three streams; retain 1 GB and a plain Activity log.

Modified: the review's two-source recommendation is an optional expansion, not the minimum. Actual Camera claims still require actual scope coverage. Its sequential schedule is replaced by parallel milestones, with model feasibility and folder classification early. Its simplified journal retains `unknown`; lack of certainty cannot be relabeled as failure or deletion. Accessibility basics remain required.

Corrected: the review says the existing `IndexedItem` contains semantic labels, but it does not. Adding `DerivedEvidence` clarifies ownership and invalidation rather than repairing that alleged defect. The review's serial architecture diagram also unnecessarily places the intent parser after evidence generation; these are separate inputs to planning.

## Sources

- Supplied workflow document: original attachment copied into `docs/source/workflow.txt`.
- Supplied design document: original attachment copied into `docs/source/product-design.txt`.
- Supplied review: original attachment copied into `docs/source/plan-review.txt`.
- Android SAF and tree restrictions: https://developer.android.com/training/data-storage/shared/documents-files
- Android shared media and supported action flows: https://developer.android.com/training/data-storage/shared/media

The supplied documents are the narrative brief. The corrections in this proposed plan resolve their contradictions for implementation; changes to scope remain explicit.
