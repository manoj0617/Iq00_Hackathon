import type {
  CleanupPlan,
  CleanupResult,
  DemoFile,
  DemoInventory,
  InvariantCheck,
  ProtectedScope,
} from '../contracts'

export type CleanupRejectionReason =
  | 'invalid_operation'
  | 'stale_revision'
  | 'unknown_file'
  | 'not_candidate'
  | 'protected'
  | 'retained'
  | 'duplicate_group_empty'

export interface CleanupReconciliation {
  expectedRemovedIds: string[]
  removedIds: string[]
  expectedButPresentIds: string[]
  unexpectedRemovedIds: string[]
  removedBytes: number
  remainingDuplicateGroups: Array<{
    key: string
    memberIds: string[]
  }>
  consistent: boolean
}

export interface SimulateCleanupInput {
  inventory: DemoInventory
  plan: CleanupPlan
  operationId: string
  completedAt: string
  confirmed: boolean
  selectedIds?: readonly string[]
  previousResults?: readonly CleanupResult[]
}

export type CleanupSimulationOutcome =
  | {
      status: 'completed'
      inventory: DemoInventory
      result: CleanupResult
      reconciliation: CleanupReconciliation
    }
  | {
      status: 'already_applied'
      inventory: DemoInventory
      result: CleanupResult
    }
  | {
      status: 'cancelled'
      inventory: DemoInventory
    }
  | {
      status: 'rejected'
      reason: CleanupRejectionReason
      affectedIds: string[]
      inventory: DemoInventory
    }

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function isProtectedByIntent(file: DemoFile, scopes: ReadonlySet<ProtectedScope>): boolean {
  return file.semanticScopes.some(
    (scope) =>
      (scope === 'semester_2' && scopes.has('semester_2')) ||
      (scope === 'camera' && scopes.has('camera')),
  )
}

function groupDuplicateMembers(files: readonly DemoFile[]): Map<string, string[]> {
  const groups = new Map<string, string[]>()

  for (const file of files) {
    if (!file.duplicateKey) continue
    const members = groups.get(file.duplicateKey) ?? []
    members.push(file.id)
    groups.set(file.duplicateKey, members)
  }

  return groups
}

function reject(
  inventory: DemoInventory,
  reason: CleanupRejectionReason,
  affectedIds: readonly string[] = [],
): CleanupSimulationOutcome {
  return {
    status: 'rejected',
    reason,
    affectedIds: unique(affectedIds),
    inventory,
  }
}

export function reconcileCleanup(
  before: DemoInventory,
  after: DemoInventory,
  expectedRemovedIds: readonly string[],
): CleanupReconciliation {
  const expected = unique(expectedRemovedIds)
  const expectedSet = new Set(expected)
  const beforeById = new Map(before.files.map((file) => [file.id, file]))
  const afterIds = new Set(after.files.map((file) => file.id))
  const removedIds = before.files.filter((file) => !afterIds.has(file.id)).map((file) => file.id)
  const removedSet = new Set(removedIds)
  const expectedButPresentIds = expected.filter((id) => afterIds.has(id))
  const unexpectedRemovedIds = removedIds.filter((id) => !expectedSet.has(id))
  const removedBytes = removedIds.reduce(
    (total, id) => total + (beforeById.get(id)?.bytes ?? 0),
    0,
  )
  const remainingDuplicateGroups = [...groupDuplicateMembers(after.files)].map(
    ([key, memberIds]) => ({ key, memberIds }),
  )

  return {
    expectedRemovedIds: expected,
    removedIds,
    expectedButPresentIds,
    unexpectedRemovedIds,
    removedBytes,
    remainingDuplicateGroups,
    consistent:
      expectedButPresentIds.length === 0 &&
      unexpectedRemovedIds.length === 0 &&
      expected.every((id) => removedSet.has(id)),
  }
}

/**
 * Applies one confirmed operation to demo metadata. It performs no persistence or
 * device I/O and returns the original inventory object for every non-completed path.
 */
export function simulateCleanup(input: SimulateCleanupInput): CleanupSimulationOutcome {
  const {
    inventory,
    plan,
    operationId,
    completedAt,
    confirmed,
    previousResults = [],
  } = input

  if (!confirmed) {
    return { status: 'cancelled', inventory }
  }

  if (!operationId.trim()) {
    return reject(inventory, 'invalid_operation')
  }

  const previousResult = previousResults.find((result) => result.operationId === operationId)
  if (previousResult) {
    return {
      status: 'already_applied',
      inventory,
      result: previousResult,
    }
  }

  if (plan.inventoryRevision !== inventory.revision) {
    return reject(inventory, 'stale_revision')
  }

  const selectedIds = unique(input.selectedIds ?? plan.selectedIds)
  const inventoryById = new Map(inventory.files.map((file) => [file.id, file]))
  const unknownIds = selectedIds.filter((id) => !inventoryById.has(id))
  if (unknownIds.length > 0) {
    return reject(inventory, 'unknown_file', unknownIds)
  }

  const candidateIds = new Set(plan.candidates.map((candidate) => candidate.fileId))
  const nonCandidateIds = selectedIds.filter((id) => !candidateIds.has(id))
  if (nonCandidateIds.length > 0) {
    return reject(inventory, 'not_candidate', nonCandidateIds)
  }

  const protectedScopes = new Set(plan.intent.protectedScopes)
  const declaredProtectedIds = new Set(plan.protectedIds)
  const protectedIds = selectedIds.filter((id) => {
    const file = inventoryById.get(id)
    return Boolean(
      declaredProtectedIds.has(id) || (file && isProtectedByIntent(file, protectedScopes)),
    )
  })
  if (protectedIds.length > 0) {
    return reject(inventory, 'protected', protectedIds)
  }

  const retainedIds = new Set([
    ...plan.retainedIds,
    ...plan.duplicateGroups.map((group) => group.retainedId),
  ])
  const selectedRetainedIds = selectedIds.filter((id) => retainedIds.has(id))
  if (selectedRetainedIds.length > 0) {
    return reject(inventory, 'retained', selectedRetainedIds)
  }

  const selectedSet = new Set(selectedIds)
  const emptiedGroupIds: string[] = []
  for (const memberIds of groupDuplicateMembers(inventory.files).values()) {
    if (memberIds.every((id) => selectedSet.has(id))) {
      emptiedGroupIds.push(...memberIds)
    }
  }
  if (emptiedGroupIds.length > 0) {
    return reject(inventory, 'duplicate_group_empty', emptiedGroupIds)
  }

  const remainingFiles = inventory.files.filter((file) => !selectedSet.has(file.id))
  const nextInventory: DemoInventory = {
    ...inventory,
    revision: inventory.revision + 1,
    updatedAt: completedAt,
    files: remainingFiles,
  }
  const reconciliation = reconcileCleanup(inventory, nextInventory, selectedIds)
  const checks: InvariantCheck[] = [
    {
      key: 'protected',
      label: 'Protected demo files remain',
      passed: inventory.files
        .filter(
          (file) =>
            declaredProtectedIds.has(file.id) || isProtectedByIntent(file, protectedScopes),
        )
        .every((file) => remainingFiles.some((remaining) => remaining.id === file.id)),
    },
    {
      key: 'retained',
      label: 'Each fixture duplicate group retains a copy',
      passed: [...groupDuplicateMembers(inventory.files).values()].every((memberIds) =>
        memberIds.some((id) => remainingFiles.some((file) => file.id === id)),
      ),
    },
  ]
  const result: CleanupResult = {
    operationId,
    removedIds: reconciliation.removedIds,
    removedBytes: reconciliation.removedBytes,
    beforeRevision: inventory.revision,
    afterRevision: nextInventory.revision,
    checks,
    completedAt,
  }

  return {
    status: 'completed',
    inventory: nextInventory,
    result,
    reconciliation,
  }
}

