# Design System

## Direction

Scene: a student reviews a potentially destructive cleanup on a phone under bright judging-room lighting and needs every consequence to read instantly. Use a restrained Pixel-style utility language: bright neutral canvas, quiet structural surfaces, architectural cobalt actions, compact evidence labels, and no decorative AI styling.

## Color

Implement these canonical OKLCH values as shared CSS custom properties. This release is a responsive browser demo; Compose theme resources are unnecessary.

- Background: `oklch(1.000 0.000 0)`
- Surface: `oklch(0.970 0.004 250)`
- Surface strong: `oklch(0.925 0.008 250)`
- Ink: `oklch(0.205 0.020 250)`
- Muted ink: `oklch(0.445 0.022 250)`
- Primary: `oklch(0.450 0.123 250)`
- Primary container: `oklch(0.925 0.035 250)`
- Success: `oklch(0.430 0.110 150)`
- Success container: `oklch(0.940 0.035 150)`
- Review: `oklch(0.520 0.125 75)`
- Review container: `oklch(0.950 0.050 85)`
- Error: `oklch(0.480 0.170 25)`
- Outline: `oklch(0.810 0.010 250)`

Primary is reserved for actions, current selection, and interaction state. Green communicates confirmed facts or completion. Amber communicates required review. Neutral grey communicates protection, unavailability, and supporting information. Status always includes text or an icon.

## Typography

Use a system sans stack. Page titles are 1.5rem/1.875rem semibold; section titles 1.125rem/1.5rem; body 1rem/1.5rem; metadata 0.875rem/1.25rem; labels 0.75rem/1rem semibold. Use tabular figures for byte totals. Avoid marketing-scale headings.

## Layout

- 16px horizontal screen margins and 12–16px vertical gaps.
- 48px minimum interactive height.
- 12px standard radius; 16px only for the main command surface.
- Use one dividing border or a restrained elevation, never both as decoration.
- Sticky bottom action area on Plan and Review, respecting navigation insets.
- Prefer grouped rows and clear section rhythm over nested card grids.
- Keep deliberate scrolling short on the scripted path.
- Mobile fills the viewport; desktop centers a readable app surface without a decorative phone frame. Respect safe-area insets.

## Components

- Command field: dominant multiline input with examples as selectable chips underneath.
- Evidence chip: one compact component with proven, user-directed, review-required, protected, and metadata variants.
- File row: filename, resolvable source, size/date, evidence reason, and selection control; long names wrap or ellipsize without hiding status.
- Plan group: heading, unique selected bytes, item count, evidence sentence, and disclosure action.
- Protection row: lock/shield icon, scope name, coverage status, and reason.
- Bottom action bar: selected bytes, target/shortfall state, secondary adjustment action, and one explicit primary action.
- Result measure: files removed from demo, simulated space reclaimed, and protected/retained demo content checks. Never display invented physical recovery.

All controls define default, pressed, focused, selected, disabled, loading, and error behavior. Loading uses stable content placeholders or concise inline status; do not stage fake scanning progress.

## Motion

Use 150–250ms state transitions for disclosure, chip changes and screen continuity. Respect prefers-reduced-motion. Never animate success numbers as though measurement were still occurring.

## Screen Cadence

Home centers the request and index coverage. Parsed Intent turns prose into editable target/protection/priority rows. Plan groups evidence without conflating categories. Detail screens show source facts and reasons. Final Review names the actual action and protected content. Result reports partial, unavailable, cancelled, and completed outcomes with the same hierarchy rather than forcing a universal success treatment.

Keep “Demo mode · Sample files” quietly visible. Use “Demo interpretation”, “Fixture evidence” and “Simulate cleanup” at the relevant steps. Confirmation is an accessible in-app dialog, never an imitation Android permission prompt.
