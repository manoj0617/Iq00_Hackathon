import type {
  ActivityEntry,
  CandidateScope,
  DemoFile,
  Evidence,
  InvariantCheck,
  ProtectedScope,
  WorkflowScreen,
} from '../contracts'

export type EvidenceTone = 'proven' | 'directed' | 'review' | 'protected' | 'metadata'

export interface NavigationItem {
  screen: Extract<WorkflowScreen, 'home' | 'storage' | 'activity'>
  label: string
}

export interface FileRowView {
  file: DemoFile
  evidence: Evidence[]
  selected?: boolean
  protected?: boolean
  retained?: boolean
  selectionLabel?: string
}

export interface PlanGroupView {
  id: string
  title: string
  description: string
  itemCount: number
  selectedCount: number
  selectedBytes: number
  evidenceTone: EvidenceTone
  evidenceLabel: string
  selected?: boolean
  reviewRequired?: boolean
}

export interface ProtectionView {
  scope: ProtectedScope
  label: string
  detail: string
  coveredCount: number
}

export interface PriorityView {
  scope: CandidateScope
  label: string
  detail: string
}

export interface ResultCheckView extends InvariantCheck {
  detail?: string
}

export interface StorageGroupView {
  id: string
  label: string
  detail: string
  fileCount: number
  bytes: number
}

export interface ActivityDayView {
  label: string
  entries: ActivityEntry[]
}

export interface FollowUpView {
  question: string
  answer: string | null
  isLoading?: boolean
}
