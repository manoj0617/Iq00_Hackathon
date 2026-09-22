# Implementation status

## Outcome

The mobile-first React/TypeScript browser demo is implemented. `SOL_IMPLEMENTATION_PLAN.md` remains authoritative. It operates entirely on versioned sample metadata and never accesses device files.

The repository is ready for Vercel as a static Vite SPA. `vercel.json` fixes the framework, build command, `dist` output, deep-link fallback and immutable asset caching; `package.json` pins the supported Node 22 major. Deployment requires no runtime environment variables.

## Delivered

- Home, editable interpretation, evidence-led plan, evidence detail, final review, accessible confirmation, result, Storage and Activity screens.
- Bounded MB/GB request parser with protection and explicit priority ordering; unsupported wording stays unresolved.
- Deterministic planner with global protected-scope exclusion, duplicate-copy retention, unique byte accounting, explicit ambiguous-match review and stale-revision checks.
- Realistic metadata-only Sem1/Sem2/DCIM/Download fixtures with more than 1 GB of valid removable candidates.
- Pure cleanup simulation, before/after reconciliation, idempotent operation protection, versioned local persistence, cross-tab invalidation and scoped reset.
- Follow-up answer generated from the updated inventory.
- Responsive OKLCH UI, keyboard/focus states, reduced motion and explicit Demo mode / Sample files language.
- Duplicate-only search without a target, target shortfall behavior and partial-plan review.

## Verification

- Production TypeScript/Vite build: passed; 1,906 modules transformed.
- Vitest: 32 tests passed across domain, simulation, seed and persistence suites.
- Playwright: 8 scenarios passed across mobile Pixel 7 and desktop Chromium. Covered the responsive mobile canvas, complete workflow, evidence, cancellation, confirmation, persistence, reset, updated-inventory follow-up, shortfall after deselection and target-free duplicate search.
- UI checks at 360px, 390px and 1280px: no horizontal overflow; wide screens use a centered 432px by up-to-844px mobile canvas; screen-change scroll restoration verified.
- Dialog: modal focus, Escape cancellation, disclosure and focus return verified.
- Dependency install reported zero vulnerabilities. Package versions are pinned in `package.json`/`package-lock.json`.

## Run

The system `npm` shim on this machine points to a missing roaming npm module. Use the installed npm CLI command documented in `README.md`; project scripts themselves are standard. `npm run test:e2e` uses a repository runner that starts and stops Vite reliably and selects an installed Chromium fallback when Playwright's exact bundled revision is unavailable.

## Scope boundary

This release demonstrates the product workflow over sample records. It does not prove Android storage access, on-device AI, phone-file hashing, actual deletion or recovered physical storage. The repository is deployment-ready, but no Vercel project has been linked or deployed from this workspace.
