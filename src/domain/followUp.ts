import type { DemoFile, DemoInventory, DuplicateGroup } from '../contracts'
import { buildDuplicateGroups, compareFiles } from './evidence'

export interface BeeLabRecordFollowUp {
  query: string
  inventoryRevision: number
  matchingFileIds: string[]
  matchingFiles: DemoFile[]
  duplicateGroups: DuplicateGroup[]
  hasExactDuplicates: boolean
  headline: string
  detail: string
}

const DEFAULT_BEE_QUERY = 'Do I still have duplicates of my BEE lab record?'

function isBeeLabRecord(file: DemoFile): boolean {
  const normalizedName = file.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ')
  return /\bbee\b/.test(normalizedName) && /\blab\b/.test(normalizedName) && /\brecord\b/.test(normalizedName)
}

/** Answers the one bounded follow-up from the current revision, after any simulation update. */
export function getBeeLabRecordFollowUp(
  inventory: DemoInventory,
  query = DEFAULT_BEE_QUERY,
): BeeLabRecordFollowUp {
  const allGroups = buildDuplicateGroups(inventory.files)
  const directlyMatchingIds = new Set(inventory.files.filter(isBeeLabRecord).map((file) => file.id))
  const matchingGroups = allGroups.filter((group) =>
    group.memberIds.some((memberId) => directlyMatchingIds.has(memberId)),
  )
  const matchingIds = new Set(directlyMatchingIds)
  for (const group of matchingGroups) {
    for (const memberId of group.memberIds) matchingIds.add(memberId)
  }

  const matchingFiles = inventory.files
    .filter((file) => matchingIds.has(file.id))
    .sort(compareFiles)
  const count = matchingFiles.length
  const hasExactDuplicates = matchingGroups.length > 0

  let headline = 'No BEE lab record files found'
  let detail = 'The current demo inventory contains no accessible BEE lab record fixture.'
  if (count === 1) {
    headline = 'One BEE lab record copy remains'
    detail = 'No exact duplicates were found in the current demo inventory.'
  } else if (count > 1 && hasExactDuplicates) {
    headline = `${count} BEE lab record copies remain`
    detail = `${matchingGroups.length} fixture-declared exact duplicate ${matchingGroups.length === 1 ? 'group remains' : 'groups remain'} in the current demo inventory.`
  } else if (count > 1) {
    headline = `${count} BEE lab record files remain`
    detail = 'No fixture-declared exact duplicate group links these files.'
  }

  return {
    query,
    inventoryRevision: inventory.revision,
    matchingFileIds: matchingFiles.map((file) => file.id),
    matchingFiles,
    duplicateGroups: matchingGroups,
    hasExactDuplicates,
    headline,
    detail,
  }
}

