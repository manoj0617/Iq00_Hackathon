import type { CandidateScope, DemoFile, DuplicateGroup, Evidence } from '../contracts'

export const OLD_DOWNLOAD_AGE_DAYS = 90
const DAY_IN_MS = 24 * 60 * 60 * 1_000

function compareText(left: string, right: string): number {
  const normalizedLeft = left.toLocaleLowerCase('en-US')
  const normalizedRight = right.toLocaleLowerCase('en-US')
  if (normalizedLeft < normalizedRight) return -1
  if (normalizedLeft > normalizedRight) return 1
  return left < right ? -1 : left > right ? 1 : 0
}

export function compareFiles(left: DemoFile, right: DemoFile): number {
  return compareText(left.path, right.path) || compareText(left.id, right.id)
}

function uniqueFiles(files: readonly DemoFile[]): DemoFile[] {
  const byId = new Map<string, DemoFile>()
  for (const file of files) {
    if (!byId.has(file.id)) byId.set(file.id, file)
  }
  return [...byId.values()].sort(compareFiles)
}

function chooseRetainedFile(files: readonly DemoFile[], protectedIds: ReadonlySet<string>): DemoFile {
  return [...files].sort((left, right) => {
    const protectionDifference = Number(protectedIds.has(right.id)) - Number(protectedIds.has(left.id))
    if (protectionDifference !== 0) return protectionDifference

    const leftIsDownload = left.semanticScopes.includes('download')
    const rightIsDownload = right.semanticScopes.includes('download')
    const downloadDifference = Number(leftIsDownload) - Number(rightIsDownload)
    return downloadDifference || compareFiles(left, right)
  })[0]
}

/** Builds fixture-declared groups from the current inventory, never from filenames. */
export function buildDuplicateGroups(
  files: readonly DemoFile[],
  protectedIds: ReadonlySet<string> = new Set<string>(),
): DuplicateGroup[] {
  const grouped = new Map<string, DemoFile[]>()

  for (const file of uniqueFiles(files)) {
    if (!file.duplicateKey) continue
    const members = grouped.get(file.duplicateKey) ?? []
    members.push(file)
    grouped.set(file.duplicateKey, members)
  }

  return [...grouped.entries()]
    .filter(([, members]) => members.length > 1)
    .sort(([left], [right]) => compareText(left, right))
    .map(([key, unsortedMembers]) => {
      const members = [...unsortedMembers].sort(compareFiles)
      const retained = chooseRetainedFile(members, protectedIds)
      const removable = members.filter(
        (file) => file.id !== retained.id && !protectedIds.has(file.id),
      )

      return {
        key,
        memberIds: members.map((file) => file.id),
        retainedId: retained.id,
        removableIds: removable.map((file) => file.id),
        bytesReclaimable: removable.reduce((total, file) => total + safeBytes(file.bytes), 0),
      }
    })
}

export function safeBytes(bytes: number): number {
  return Number.isFinite(bytes) && bytes > 0 ? Math.floor(bytes) : 0
}

export function isOldDownload(file: DemoFile, inventoryUpdatedAt: string): boolean {
  if (!file.semanticScopes.includes('download')) return false
  const modifiedAt = Date.parse(file.modifiedAt)
  const indexedAt = Date.parse(inventoryUpdatedAt)
  if (!Number.isFinite(modifiedAt) || !Number.isFinite(indexedAt)) return false
  return indexedAt - modifiedAt >= OLD_DOWNLOAD_AGE_DAYS * DAY_IN_MS
}

export function resolveCandidateEvidence(
  file: DemoFile,
  duplicateGroup: DuplicateGroup | undefined,
  inventoryUpdatedAt: string,
): Evidence[] {
  const evidence: Evidence[] = []

  if (duplicateGroup?.removableIds.includes(file.id)) {
    evidence.push({
      kind: 'duplicate',
      label: 'Fixture-declared exact duplicate',
      basis: `${duplicateGroup.memberIds.length} active fixture copies share duplicate key ${duplicateGroup.key}; ${duplicateGroup.retainedId} is retained.`,
      provenance: 'fixture',
      requiresReview: false,
    })
  }

  if (file.semanticScopes.includes('semester_1')) {
    evidence.push({
      kind: 'folder',
      label: 'Semester 1 folder',
      basis: 'The fixture record is inside the requested Semester 1 scope.',
      provenance: 'fixture',
      requiresReview: false,
    })
  } else if (file.ambiguousSemesterOne) {
    evidence.push({
      kind: 'filename',
      label: 'Possible Semester 1 filename match',
      basis: 'The fixture filename suggests Semester 1 material, but folder evidence does not confirm it.',
      provenance: 'fixture',
      requiresReview: true,
    })
  }

  if (isOldDownload(file, inventoryUpdatedAt)) {
    evidence.push({
      kind: 'folder',
      label: 'Old download',
      basis: `The fixture record is in Download and predates the inventory refresh by at least ${OLD_DOWNLOAD_AGE_DAYS} days.`,
      provenance: 'fixture',
      requiresReview: false,
    })
  }

  return evidence
}

export function evidenceSupportsScope(evidence: readonly Evidence[], scope: CandidateScope): boolean {
  if (scope === 'exact_duplicates') return evidence.some((item) => item.kind === 'duplicate')
  if (scope === 'semester_1') {
    return evidence.some((item) =>
      item.label === 'Semester 1 folder' || item.label === 'Possible Semester 1 filename match',
    )
  }
  return evidence.some((item) => item.label === 'Old download')
}

