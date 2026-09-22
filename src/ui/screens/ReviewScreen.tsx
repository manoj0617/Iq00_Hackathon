import type { CleanupPlan } from '../../contracts'
import type { FileRowView, ProtectionView } from '../types'
import { BottomActionBar } from '../components/BottomActionBar'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { InlineNotice, PageHeading } from '../components/Primitives'
import { FileRow, ProtectionRow } from '../components/Rows'

export interface ReviewScreenProps {
  plan: CleanupPlan
  files: FileRowView[]
  protections: ProtectionView[]
  retainedCount: number
  confirmationOpen: boolean
  onToggleFile: (fileId: string, selected: boolean) => void
  onAdjust: () => void
  onRequestCleanup: () => void
  onCancelCleanup: () => void
  onConfirmCleanup: () => void
  isSubmitting?: boolean
}

export function ReviewScreen({
  plan,
  files,
  protections,
  retainedCount,
  confirmationOpen,
  onToggleFile,
  onAdjust,
  onRequestCleanup,
  onCancelCleanup,
  onConfirmCleanup,
  isSubmitting = false,
}: ReviewScreenProps) {
  return (
    <div className="screen screen--with-action-bar">
      <PageHeading title="Final review" description="Only the selected sample records below will leave the demo inventory." />
      <InlineNotice title="This is a simulation" tone="info">No device files or physical storage are changed.</InlineNotice>

      <section className="screen-section" aria-labelledby="selected-files-heading">
        <div className="section-heading"><div><h2 id="selected-files-heading">Selected files</h2><p>{files.length} records selected for the simulated cleanup.</p></div></div>
        <div className="grouped-list">{files.map((row) => <FileRow key={row.file.id} {...row} onToggle={onToggleFile} />)}</div>
      </section>

      <section className="screen-section" aria-labelledby="protected-review-heading">
        <div className="section-heading"><div><h2 id="protected-review-heading">Content that stays</h2><p>{retainedCount} duplicate {retainedCount === 1 ? 'copy is' : 'copies are'} retained, plus protected scopes.</p></div></div>
        <div className="grouped-list">{protections.map((protection) => <ProtectionRow key={protection.scope} {...protection} />)}</div>
      </section>

      <BottomActionBar
        selectedBytes={plan.selectedBytes}
        selectedCount={plan.selectedIds.length}
        targetBytes={plan.targetBytes}
        shortfallBytes={plan.shortfallBytes}
        primaryLabel="Simulate cleanup"
        onPrimary={onRequestCleanup}
        primaryDisabled={plan.selectedIds.length === 0}
        secondaryLabel="Adjust selection"
        onSecondary={onAdjust}
      />

      <ConfirmationDialog
        open={confirmationOpen}
        fileCount={plan.selectedIds.length}
        selectedBytes={plan.selectedBytes}
        onCancel={onCancelCleanup}
        onConfirm={onConfirmCleanup}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
