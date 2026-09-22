export const DEMO_SCHEMA_VERSION = 1 as const
export const DEMO_STORAGE_KEY = 'storage-intelligence:demo:v1'

export type FileKind = 'document' | 'archive' | 'video' | 'image'
export type CandidateScope = 'exact_duplicates' | 'semester_1' | 'old_downloads'
export type ProtectedScope = 'semester_2' | 'camera'
export type EvidenceKind = 'duplicate' | 'folder' | 'filename'
export type InterpretationSource = 'demo-parser'

export interface DemoFile {
  id: string
  name: string
  path: string
  bytes: number
  kind: FileKind
  modifiedAt: string
  duplicateKey?: string
  semanticScopes: Array<'semester_1' | 'semester_2' | 'camera' | 'download'>
  ambiguousSemesterOne?: boolean
}

export interface DemoInventory {
  schemaVersion: typeof DEMO_SCHEMA_VERSION
  revision: number
  updatedAt: string
  files: DemoFile[]
}

export interface ParsedIntent {
  originalRequest: string
  targetBytes: number | null
  protectedScopes: ProtectedScope[]
  priorities: CandidateScope[]
  unresolvedTerms: string[]
  source: InterpretationSource
}

export interface Evidence {
  kind: EvidenceKind
  label: string
  basis: string
  provenance: 'fixture'
  requiresReview: boolean
}

export interface PlanCandidate {
  fileId: string
  bucket: CandidateScope
  evidence: Evidence[]
  selectedByDefault: boolean
}

export interface DuplicateGroup {
  key: string
  memberIds: string[]
  retainedId: string
  removableIds: string[]
  bytesReclaimable: number
}

export interface CleanupPlan {
  id: string
  inventoryRevision: number
  intent: ParsedIntent
  candidates: PlanCandidate[]
  protectedIds: string[]
  retainedIds: string[]
  selectedIds: string[]
  duplicateGroups: DuplicateGroup[]
  selectedBytes: number
  targetBytes: number | null
  shortfallBytes: number
}

export interface InvariantCheck {
  key: 'protected' | 'retained'
  label: string
  passed: boolean
}

export interface CleanupResult {
  operationId: string
  removedIds: string[]
  removedBytes: number
  beforeRevision: number
  afterRevision: number
  checks: InvariantCheck[]
  completedAt: string
}

export type WorkflowScreen = 'home' | 'intent' | 'plan' | 'review' | 'result' | 'storage' | 'activity'

export interface ActivityEntry {
  id: string
  at: string
  title: string
  detail: string
}

export interface PersistedDemoState {
  schemaVersion: typeof DEMO_SCHEMA_VERSION
  inventory: DemoInventory
  activity: ActivityEntry[]
}

export interface DemoState extends PersistedDemoState {
  screen: WorkflowScreen
  intent: ParsedIntent | null
  plan: CleanupPlan | null
  result: CleanupResult | null
  selectedDetailId: string | null
  persistenceNotice: string | null
}
