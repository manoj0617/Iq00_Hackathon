import type { CleanupPlan, DemoInventory } from '../contracts'
import { buildCleanupPlan, calculateSelectedBytes } from './planner'

export class StalePlanError extends Error {
  constructor(planRevision: number, inventoryRevision: number) {
    super(`Plan revision ${planRevision} does not match inventory revision ${inventoryRevision}. Rebuild the plan.`)
    this.name = 'StalePlanError'
  }
}

export class InvalidSelectionError extends Error {
  constructor(fileId: string) {
    super(`File ${fileId} is not an eligible candidate in this plan.`)
    this.name = 'InvalidSelectionError'
  }
}

export function isPlanCurrent(plan: CleanupPlan, inventory: DemoInventory): boolean {
  return plan.inventoryRevision === inventory.revision
}

export function assertPlanRevision(plan: CleanupPlan, inventory: DemoInventory): void {
  if (!isPlanCurrent(plan, inventory)) {
    throw new StalePlanError(plan.inventoryRevision, inventory.revision)
  }
}

function withSelection(
  plan: CleanupPlan,
  inventory: DemoInventory,
  selectedIds: readonly string[],
): CleanupPlan {
  const uniqueSelectedIds = [...new Set(selectedIds)]
  const selectedBytes = calculateSelectedBytes(inventory, uniqueSelectedIds)
  return {
    ...plan,
    selectedIds: uniqueSelectedIds,
    selectedBytes,
    shortfallBytes: plan.targetBytes === null ? 0 : Math.max(0, plan.targetBytes - selectedBytes),
  }
}

/** Re-resolves all exclusions and derived totals while preserving valid explicit choices. */
export function recalculatePlan(plan: CleanupPlan, inventory: DemoInventory): CleanupPlan {
  assertPlanRevision(plan, inventory)
  const rebuilt = buildCleanupPlan(inventory, plan.intent)
  const eligibleIds = new Set(rebuilt.candidates.map((candidate) => candidate.fileId))
  const selectedIds = plan.selectedIds.filter((fileId) => eligibleIds.has(fileId))
  return withSelection(rebuilt, inventory, selectedIds)
}

export function setPlanSelection(
  plan: CleanupPlan,
  inventory: DemoInventory,
  selectedIds: readonly string[],
): CleanupPlan {
  const rebuilt = buildCleanupPlan(inventory, plan.intent)
  assertPlanRevision(plan, inventory)
  const eligibleIds = new Set(rebuilt.candidates.map((candidate) => candidate.fileId))

  for (const fileId of selectedIds) {
    if (!eligibleIds.has(fileId)) throw new InvalidSelectionError(fileId)
  }

  const requested = new Set(selectedIds)
  const orderedSelection = rebuilt.candidates
    .map((candidate) => candidate.fileId)
    .filter((fileId) => requested.has(fileId))
  return withSelection(rebuilt, inventory, orderedSelection)
}

export function updatePlanSelection(
  plan: CleanupPlan,
  inventory: DemoInventory,
  fileId: string,
  selected: boolean,
): CleanupPlan {
  const current = recalculatePlan(plan, inventory)
  const eligibleIds = new Set(current.candidates.map((candidate) => candidate.fileId))
  if (!eligibleIds.has(fileId)) throw new InvalidSelectionError(fileId)

  const selection = new Set(current.selectedIds)
  if (selected) selection.add(fileId)
  else selection.delete(fileId)
  return setPlanSelection(current, inventory, [...selection])
}

