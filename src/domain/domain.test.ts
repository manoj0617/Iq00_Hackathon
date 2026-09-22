import { describe, expect, it } from 'vitest'
import type { DemoFile, DemoInventory, ParsedIntent } from '../contracts'
import {
  InvalidSelectionError,
  StalePlanError,
  buildCleanupPlan,
  getBeeLabRecordFollowUp,
  parseIntent,
  recalculatePlan,
  setPlanSelection,
  updatePlanSelection,
} from './index'

const MB = 1_000_000

function file(overrides: Partial<DemoFile> & Pick<DemoFile, 'id' | 'name' | 'path' | 'bytes'>): DemoFile {
  return {
    kind: 'document',
    modifiedAt: '2026-05-01T00:00:00.000Z',
    semanticScopes: [],
    ...overrides,
  }
}

function inventory(files: DemoFile[] = fixtureFiles, revision = 4): DemoInventory {
  return {
    schemaVersion: 1,
    revision,
    updatedAt: '2026-09-01T00:00:00.000Z',
    files,
  }
}

const fixtureFiles: DemoFile[] = [
  file({
    id: 'bee-canonical',
    name: 'BEE_Lab_Record.pdf',
    path: 'Documents/College/Sem1/BEE_Lab_Record.pdf',
    bytes: 100 * MB,
    duplicateKey: 'bee-record',
    semanticScopes: ['semester_1'],
  }),
  file({
    id: 'bee-copy-a',
    name: 'BEE_Lab_Record.pdf',
    path: 'Download/BEE_Lab_Record.pdf',
    bytes: 100 * MB,
    duplicateKey: 'bee-record',
    semanticScopes: ['semester_1', 'download'],
  }),
  file({
    id: 'bee-copy-b',
    name: 'BEE_Lab_Record (1).pdf',
    path: 'Download/BEE_Lab_Record (1).pdf',
    bytes: 100 * MB,
    duplicateKey: 'bee-record',
    semanticScopes: ['download'],
  }),
  file({
    id: 'protected-sem2',
    name: 'Current_notes.pdf',
    path: 'Documents/College/Sem2/Current_notes.pdf',
    bytes: 300 * MB,
    duplicateKey: 'mixed-protection',
    semanticScopes: ['semester_2'],
  }),
  file({
    id: 'mixed-copy',
    name: 'Current_notes_copy.pdf',
    path: 'Download/Current_notes_copy.pdf',
    bytes: 300 * MB,
    duplicateKey: 'mixed-protection',
    semanticScopes: ['download'],
  }),
  file({
    id: 'sem1-video',
    name: 'BEE_Practical_Video.mp4',
    path: 'Documents/College/Sem1/BEE_Practical_Video.mp4',
    bytes: 800 * MB,
    kind: 'video',
    semanticScopes: ['semester_1'],
  }),
  file({
    id: 'ambiguous',
    name: 'M1_Previous_Papers.pdf',
    path: 'Documents/M1_Previous_Papers.pdf',
    bytes: 250 * MB,
    ambiguousSemesterOne: true,
    semanticScopes: [],
  }),
  file({
    id: 'old-download',
    name: 'old-installer.zip',
    path: 'Download/old-installer.zip',
    bytes: 400 * MB,
    kind: 'archive',
    modifiedAt: '2025-12-01T00:00:00.000Z',
    semanticScopes: ['download'],
  }),
  file({
    id: 'recent-download',
    name: 'recent.zip',
    path: 'Download/recent.zip',
    bytes: 450 * MB,
    kind: 'archive',
    modifiedAt: '2026-08-20T00:00:00.000Z',
    semanticScopes: ['download'],
  }),
  file({
    id: 'camera',
    name: 'IMG_0123.jpg',
    path: 'DCIM/Camera/IMG_0123.jpg',
    bytes: 50 * MB,
    kind: 'image',
    semanticScopes: ['camera'],
  }),
]

function intent(overrides: Partial<ParsedIntent> = {}): ParsedIntent {
  return {
    originalRequest: 'Free 1 GB. Keep Semester 2 and Camera. Start with exact duplicates and Semester 1.',
    targetBytes: 1_000_000_000,
    protectedScopes: ['semester_2', 'camera'],
    priorities: ['exact_duplicates', 'semester_1'],
    unresolvedTerms: [],
    source: 'demo-parser',
    ...overrides,
  }
}

describe('parseIntent', () => {
  it('parses decimal targets, explicit protection, and stated priority order', () => {
    const parsed = parseIntent(
      'Free at least 1.25 GB. Keep my Semester 2 files and DCIM/Camera photos. Start with exact duplicates and Semester 1 material.',
    )

    expect(parsed.targetBytes).toBe(1_250_000_000)
    expect(parsed.protectedScopes).toEqual(['semester_2', 'camera'])
    expect(parsed.priorities).toEqual(['exact_duplicates', 'semester_1'])
    expect(parsed.unresolvedTerms).toEqual([])
    expect(parsed.source).toBe('demo-parser')
  })

  it('preserves an explicit alternate priority order', () => {
    const parsed = parseIntent('Start with Sem1 cleanup, then exact duplicates. Free 900 MB.')
    expect(parsed.targetBytes).toBe(900_000_000)
    expect(parsed.priorities).toEqual(['semester_1', 'exact_duplicates'])
  })

  it('supports a bounded duplicate-only request', () => {
    const parsed = parseIntent('Duplicate-only cleanup')
    expect(parsed.priorities).toEqual(['exact_duplicates'])
    expect(parsed.unresolvedTerms).toEqual([])
  })

  it('supports protective do-not-touch wording without treating it as a deletion scope', () => {
    const parsed = parseIntent("Free 500 MB, but don't touch Sem 2 or camera photos. Find duplicates.")
    expect(parsed.protectedScopes).toEqual(['semester_2', 'camera'])
    expect(parsed.priorities).toEqual(['exact_duplicates'])
    expect(parsed.unresolvedTerms).toEqual([])
  })

  it('does not turn negated or unsupported wording into the hero plan', () => {
    const parsed = parseIntent("Don't include duplicates. Delete caches and giant videos, but don't keep Semester 2.")
    expect(parsed.targetBytes).toBeNull()
    expect(parsed.priorities).toEqual([])
    expect(parsed.protectedScopes).toEqual([])
    expect(parsed.unresolvedTerms.length).toBeGreaterThan(0)
  })

  it('does not reinterpret an unsupported upper-bound target as a minimum target', () => {
    const parsed = parseIntent('Keep cleanup under 500 MB')
    expect(parsed.targetBytes).toBeNull()
    expect(parsed.unresolvedTerms.length).toBeGreaterThan(0)
  })
})

describe('buildCleanupPlan', () => {
  it('applies protection and duplicate retention globally before categorization', () => {
    const plan = buildCleanupPlan(inventory(), intent())

    expect(plan.protectedIds).toEqual(['camera', 'protected-sem2'])
    expect(plan.retainedIds).toContain('bee-canonical')
    expect(plan.retainedIds).toContain('protected-sem2')
    expect(plan.candidates.map((candidate) => candidate.fileId)).not.toContain('bee-canonical')
    expect(plan.candidates.map((candidate) => candidate.fileId)).not.toContain('protected-sem2')
    expect(plan.selectedIds).not.toContain('camera')
    expect(plan.selectedIds).not.toContain('protected-sem2')
  })

  it('accounts for overlapping candidates once according to explicit priority', () => {
    const plan = buildCleanupPlan(inventory(), intent())
    const overlapping = plan.candidates.filter((candidate) => candidate.fileId === 'bee-copy-a')

    expect(overlapping).toHaveLength(1)
    expect(overlapping[0].bucket).toBe('exact_duplicates')
    expect(plan.selectedIds.filter((fileId) => fileId === 'bee-copy-a')).toHaveLength(1)
    expect(plan.selectedBytes).toBe(1_300 * MB)
    expect(plan.shortfallBytes).toBe(0)
  })

  it('never adds old downloads to meet a target unless that scope is requested', () => {
    const narrow = buildCleanupPlan(
      inventory(),
      intent({ priorities: ['exact_duplicates'], targetBytes: 2_000 * MB }),
    )
    expect(narrow.candidates.map((candidate) => candidate.fileId)).not.toContain('old-download')
    expect(narrow.shortfallBytes).toBe(1_500 * MB)

    const expanded = buildCleanupPlan(
      inventory(),
      intent({ priorities: ['exact_duplicates', 'old_downloads'], targetBytes: 2_000 * MB }),
    )
    expect(expanded.candidates.map((candidate) => candidate.fileId)).toContain('old-download')
    expect(expanded.candidates.map((candidate) => candidate.fileId)).not.toContain('recent-download')
  })

  it('leaves ambiguous filename evidence unselected by default', () => {
    const plan = buildCleanupPlan(inventory(), intent())
    const ambiguous = plan.candidates.find((candidate) => candidate.fileId === 'ambiguous')

    expect(ambiguous?.selectedByDefault).toBe(false)
    expect(ambiguous?.evidence).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'filename', requiresReview: true })]),
    )
    expect(plan.selectedIds).not.toContain('ambiguous')
  })

  it('is deterministic for the same revision and inputs', () => {
    expect(buildCleanupPlan(inventory(), intent())).toEqual(buildCleanupPlan(inventory(), intent()))
  })
})

describe('selection and recalculation', () => {
  it('recomputes unique totals and shortfall after deselection', () => {
    const source = buildCleanupPlan(inventory(), intent())
    const updated = updatePlanSelection(source, inventory(), 'sem1-video', false)

    expect(updated.selectedBytes).toBe(500 * MB)
    expect(updated.shortfallBytes).toBe(500 * MB)
  })

  it('allows explicit inclusion of a review-required candidate', () => {
    const source = buildCleanupPlan(inventory(), intent())
    const updated = updatePlanSelection(source, inventory(), 'ambiguous', true)
    expect(updated.selectedIds).toContain('ambiguous')
    expect(updated.selectedBytes).toBe(1_550 * MB)
  })

  it('rejects protected, retained, or unrelated IDs', () => {
    const source = buildCleanupPlan(inventory(), intent())
    expect(() => updatePlanSelection(source, inventory(), 'protected-sem2', true)).toThrow(InvalidSelectionError)
    expect(() => updatePlanSelection(source, inventory(), 'bee-canonical', true)).toThrow(InvalidSelectionError)
    expect(() => setPlanSelection(source, inventory(), ['recent-download'])).toThrow(InvalidSelectionError)
  })

  it('fails closed when the inventory revision is stale', () => {
    const source = buildCleanupPlan(inventory(), intent())
    expect(() => updatePlanSelection(source, inventory(fixtureFiles, 5), 'sem1-video', false)).toThrow(StalePlanError)
  })

  it('re-resolves exclusions during recalculation', () => {
    const source = buildCleanupPlan(inventory(), intent())
    const tampered = {
      ...source,
      selectedIds: [...source.selectedIds, 'protected-sem2', 'bee-canonical'],
      selectedBytes: 99_999_999_999,
    }
    const repaired = recalculatePlan(tampered, inventory())
    expect(repaired.selectedIds).not.toContain('protected-sem2')
    expect(repaired.selectedIds).not.toContain('bee-canonical')
    expect(repaired.selectedBytes).toBe(1_300 * MB)
  })
})

describe('BEE lab-record follow-up', () => {
  it('reads duplicate state from the current inventory revision', () => {
    const before = getBeeLabRecordFollowUp(inventory())
    expect(before.hasExactDuplicates).toBe(true)
    expect(before.matchingFileIds).toHaveLength(3)

    const remainingFiles = fixtureFiles.filter((candidate) =>
      !['bee-copy-a', 'bee-copy-b'].includes(candidate.id),
    )
    const after = getBeeLabRecordFollowUp(inventory(remainingFiles, 5))
    expect(after.inventoryRevision).toBe(5)
    expect(after.hasExactDuplicates).toBe(false)
    expect(after.matchingFileIds).toEqual(['bee-canonical'])
    expect(after.headline).toBe('One BEE lab record copy remains')
  })
})
