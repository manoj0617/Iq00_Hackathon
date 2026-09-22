import type {
  CandidateScope,
  CleanupPlan,
  DemoFile,
  DemoInventory,
  ParsedIntent,
  PlanCandidate,
  ProtectedScope,
} from '../contracts'
import {
  buildDuplicateGroups,
  compareFiles,
  evidenceSupportsScope,
  resolveCandidateEvidence,
  safeBytes,
} from './evidence'

const candidateScopes: readonly CandidateScope[] = ['exact_duplicates', 'semester_1', 'old_downloads']
const protectedScopes: readonly ProtectedScope[] = ['semester_2', 'camera']

function uniqueValues<T>(values: readonly T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index)
}

function normalizeIntent(intent: ParsedIntent): ParsedIntent {
  const targetBytes = intent.targetBytes !== null && Number.isFinite(intent.targetBytes) && intent.targetBytes > 0
    ? Math.round(intent.targetBytes)
    : null

  return {
    ...intent,
    targetBytes,
    protectedScopes: uniqueValues(intent.protectedScopes.filter((scope) => protectedScopes.includes(scope))),
    priorities: uniqueValues(intent.priorities.filter((scope) => candidateScopes.includes(scope))),
    unresolvedTerms: uniqueValues(intent.unresolvedTerms),
    source: 'demo-parser',
  }
}

function fileIsProtected(file: DemoFile, scopes: readonly ProtectedScope[]): boolean {
  return scopes.some((scope) => {
    if (scope === 'semester_2') return file.semanticScopes.includes('semester_2')
    return file.semanticScopes.includes('camera')
  })
}

function hashText(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function planId(inventoryRevision: number, intent: ParsedIntent): string {
  const input = JSON.stringify([
    inventoryRevision,
    intent.originalRequest,
    intent.targetBytes,
    intent.protectedScopes,
    intent.priorities,
    intent.unresolvedTerms,
  ])
  return `plan-${inventoryRevision}-${hashText(input)}`
}

function uniqueInventoryFiles(inventory: DemoInventory): DemoFile[] {
  const byId = new Map<string, DemoFile>()
  for (const file of inventory.files) {
    if (!byId.has(file.id)) byId.set(file.id, file)
  }
  return [...byId.values()].sort(compareFiles)
}

function candidateSort(priorities: readonly CandidateScope[]) {
  return (left: PlanCandidate, right: PlanCandidate): number => {
    const bucketDifference = priorities.indexOf(left.bucket) - priorities.indexOf(right.bucket)
    if (bucketDifference !== 0) return bucketDifference
    return left.fileId < right.fileId ? -1 : left.fileId > right.fileId ? 1 : 0
  }
}

export function calculateSelectedBytes(inventory: DemoInventory, selectedIds: readonly string[]): number {
  const selected = new Set(selectedIds)
  return uniqueInventoryFiles(inventory).reduce(
    (total, file) => total + (selected.has(file.id) ? safeBytes(file.bytes) : 0),
    0,
  )
}

/** Creates a deterministic, non-overlapping plan solely from explicitly requested scopes. */
export function buildCleanupPlan(inventory: DemoInventory, rawIntent: ParsedIntent): CleanupPlan {
  const intent = normalizeIntent(rawIntent)
  const files = uniqueInventoryFiles(inventory)
  const protectedIds = files
    .filter((file) => fileIsProtected(file, intent.protectedScopes))
    .map((file) => file.id)
  const protectedSet = new Set(protectedIds)
  const duplicateGroups = buildDuplicateGroups(files, protectedSet)
  const retainedIds = duplicateGroups.map((group) => group.retainedId)
  const retainedSet = new Set(retainedIds)
  const groupByMemberId = new Map(
    duplicateGroups.flatMap((group) => group.memberIds.map((memberId) => [memberId, group] as const)),
  )

  const candidates: PlanCandidate[] = []
  for (const file of files) {
    if (protectedSet.has(file.id) || retainedSet.has(file.id)) continue

    const evidence = resolveCandidateEvidence(file, groupByMemberId.get(file.id), inventory.updatedAt)
    const bucket = intent.priorities.find((scope) => evidenceSupportsScope(evidence, scope))
    if (!bucket) continue

    const relevantEvidence = evidence.filter((item) => {
      if (item.kind === 'duplicate') return intent.priorities.includes('exact_duplicates')
      if (item.label === 'Old download') return intent.priorities.includes('old_downloads')
      return intent.priorities.includes('semester_1')
    })

    candidates.push({
      fileId: file.id,
      bucket,
      evidence: relevantEvidence,
      selectedByDefault: !relevantEvidence.some((item) => item.requiresReview),
    })
  }
  candidates.sort(candidateSort(intent.priorities))

  const selectedIds = candidates
    .filter((candidate) => candidate.selectedByDefault)
    .map((candidate) => candidate.fileId)
  const selectedBytes = calculateSelectedBytes(inventory, selectedIds)
  const shortfallBytes = intent.targetBytes === null ? 0 : Math.max(0, intent.targetBytes - selectedBytes)

  return {
    id: planId(inventory.revision, intent),
    inventoryRevision: inventory.revision,
    intent,
    candidates,
    protectedIds,
    retainedIds,
    selectedIds,
    duplicateGroups,
    selectedBytes,
    targetBytes: intent.targetBytes,
    shortfallBytes,
  }
}

