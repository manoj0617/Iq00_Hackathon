import { describe, expect, it } from 'vitest'

import type { CleanupPlan, DemoInventory, ParsedIntent, PlanCandidate } from '../contracts'
import { createSeedInventory } from '../data'
import { reconcileCleanup, simulateCleanup } from './cleanup'

const NOW = '2026-09-22T02:00:00.000Z'

const intent: ParsedIntent = {
  originalRequest: 'Free 1 GB from Semester 1 and duplicates. Keep Semester 2 and Camera.',
  targetBytes: 1_000_000_000,
  protectedScopes: ['semester_2', 'camera'],
  priorities: ['exact_duplicates', 'semester_1'],
  unresolvedTerms: [],
  source: 'demo-parser',
}

function candidate(fileId: string): PlanCandidate {
  return {
    fileId,
    bucket: 'semester_1',
    evidence: [
      {
        kind: 'folder',
        label: 'Semester 1 folder',
        basis: 'Fixture path is under Documents/College/Sem1',
        provenance: 'fixture',
        requiresReview: false,
      },
    ],
    selectedByDefault: true,
  }
}

function planFor(
  inventory: DemoInventory,
  selectedIds: string[],
  overrides: Partial<CleanupPlan> = {},
): CleanupPlan {
  return {
    id: 'plan-1',
    inventoryRevision: inventory.revision,
    intent,
    candidates: selectedIds.map(candidate),
    protectedIds: ['sem2-signals-reference', 'camera-campus-fest'],
    retainedIds: ['sem1-bee-lab-record'],
    selectedIds,
    duplicateGroups: [
      {
        key: 'sha256-fixture-bee-lab-record-v4',
        memberIds: ['sem1-bee-lab-record', 'download-bee-lab-record-copy'],
        retainedId: 'sem1-bee-lab-record',
        removableIds: ['download-bee-lab-record-copy'],
        bytesReclaimable: 24_800_000,
      },
    ],
    selectedBytes: 0,
    targetBytes: intent.targetBytes,
    shortfallBytes: intent.targetBytes ?? 0,
    ...overrides,
  }
}

describe('simulateCleanup', () => {
  it('removes unique selected metadata and advances the inventory revision', () => {
    const inventory = createSeedInventory({ updatedAt: '2026-09-22T00:00:00.000Z' })
    const selectedIds = [
      'sem1-circuit-theory-lectures',
      'sem1-circuit-theory-lectures',
      'sem1-engineering-graphics-demo',
    ]
    const plan = planFor(inventory, selectedIds)
    const outcome = simulateCleanup({
      inventory,
      plan,
      selectedIds,
      operationId: 'operation-1',
      completedAt: NOW,
      confirmed: true,
    })

    expect(outcome.status).toBe('completed')
    if (outcome.status !== 'completed') return

    expect(outcome.inventory).not.toBe(inventory)
    expect(outcome.inventory.revision).toBe(2)
    expect(outcome.inventory.updatedAt).toBe(NOW)
    expect(outcome.result.removedIds).toEqual([
      'sem1-circuit-theory-lectures',
      'sem1-engineering-graphics-demo',
    ])
    expect(outcome.result.removedBytes).toBe(804_650_000)
    expect(outcome.result.checks.every((check) => check.passed)).toBe(true)
    expect(outcome.reconciliation.consistent).toBe(true)
    expect(inventory.files).toHaveLength(20)
  })

  it('cancels without changing inventory', () => {
    const inventory = createSeedInventory({ updatedAt: NOW })
    const plan = planFor(inventory, ['sem1-circuit-theory-lectures'])
    const outcome = simulateCleanup({
      inventory,
      plan,
      operationId: 'operation-cancelled',
      completedAt: NOW,
      confirmed: false,
    })

    expect(outcome).toEqual({ status: 'cancelled', inventory })
    expect(outcome.inventory).toBe(inventory)
  })

  it('rejects a plan after the inventory revision changes', () => {
    const inventory = createSeedInventory({ updatedAt: NOW, revision: 3 })
    const plan = planFor(inventory, ['sem1-circuit-theory-lectures'], {
      inventoryRevision: 2,
    })
    const outcome = simulateCleanup({
      inventory,
      plan,
      operationId: 'operation-stale',
      completedAt: NOW,
      confirmed: true,
    })

    expect(outcome).toMatchObject({ status: 'rejected', reason: 'stale_revision' })
    expect(outcome.inventory).toBe(inventory)
  })

  it('derives protected files from intent even if a plan omits them', () => {
    const inventory = createSeedInventory({ updatedAt: NOW })
    const protectedId = 'sem2-data-structures-lectures'
    const plan = planFor(inventory, [protectedId], { protectedIds: [] })
    const outcome = simulateCleanup({
      inventory,
      plan,
      operationId: 'operation-protected',
      completedAt: NOW,
      confirmed: true,
    })

    expect(outcome).toMatchObject({
      status: 'rejected',
      reason: 'protected',
      affectedIds: [protectedId],
    })
    expect(outcome.inventory).toBe(inventory)
  })

  it('rejects retained IDs and attempts to empty a duplicate group', () => {
    const inventory = createSeedInventory({ updatedAt: NOW })
    const retainedPlan = planFor(inventory, ['sem1-bee-lab-record'])
    const retainedOutcome = simulateCleanup({
      inventory,
      plan: retainedPlan,
      operationId: 'operation-retained',
      completedAt: NOW,
      confirmed: true,
    })
    const bothBeeIds = ['sem1-bee-lab-record', 'download-bee-lab-record-copy']
    const emptyGroupPlan = planFor(inventory, bothBeeIds, {
      retainedIds: [],
      duplicateGroups: [],
    })
    const emptyGroupOutcome = simulateCleanup({
      inventory,
      plan: emptyGroupPlan,
      operationId: 'operation-empty-group',
      completedAt: NOW,
      confirmed: true,
    })

    expect(retainedOutcome).toMatchObject({ status: 'rejected', reason: 'retained' })
    expect(emptyGroupOutcome).toMatchObject({
      status: 'rejected',
      reason: 'duplicate_group_empty',
    })
  })

  it('does not apply the same operation twice', () => {
    const inventory = createSeedInventory({ updatedAt: NOW })
    const selectedIds = ['sem1-circuit-theory-lectures']
    const plan = planFor(inventory, selectedIds)
    const first = simulateCleanup({
      inventory,
      plan,
      operationId: 'operation-idempotent',
      completedAt: NOW,
      confirmed: true,
    })
    expect(first.status).toBe('completed')
    if (first.status !== 'completed') return

    const replay = simulateCleanup({
      inventory: first.inventory,
      plan,
      operationId: 'operation-idempotent',
      completedAt: '2026-09-22T03:00:00.000Z',
      confirmed: true,
      previousResults: [first.result],
    })

    expect(replay.status).toBe('already_applied')
    expect(replay.inventory).toBe(first.inventory)
    if (replay.status === 'already_applied') {
      expect(replay.result).toBe(first.result)
    }
  })

  it('reports unexpected removals during reconciliation', () => {
    const before = createSeedInventory({ updatedAt: NOW })
    const after: DemoInventory = {
      ...before,
      revision: 2,
      files: before.files.filter(
        (file) =>
          file.id !== 'sem1-circuit-theory-lectures' &&
          file.id !== 'sem1-engineering-graphics-demo',
      ),
    }
    const reconciliation = reconcileCleanup(before, after, [
      'sem1-circuit-theory-lectures',
    ])

    expect(reconciliation.consistent).toBe(false)
    expect(reconciliation.unexpectedRemovedIds).toEqual(['sem1-engineering-graphics-demo'])
  })
})

