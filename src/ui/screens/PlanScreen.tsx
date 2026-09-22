import type { CleanupPlan } from '../../contracts'
import type { PlanGroupView, ProtectionView } from '../types'
import { formatBytes } from '../format'
import { BottomActionBar } from '../components/BottomActionBar'
import { InlineNotice, PageHeading } from '../components/Primitives'
import { PlanGroupRow, ProtectionRow } from '../components/Rows'

export interface PlanScreenProps {
  plan: CleanupPlan
  groups: PlanGroupView[]
  protections: ProtectionView[]
  onOpenGroup: (groupId: string) => void
  onToggleGroup: (groupId: string, selected: boolean) => void
  onAdjustConstraints: () => void
  onReview: () => void
}

export function PlanScreen({ plan, groups, protections, onOpenGroup, onToggleGroup, onAdjustConstraints, onReview }: PlanScreenProps) {
  const selectedCount = plan.selectedIds.length
  return (
    <div className="screen screen--with-action-bar">
      <PageHeading title="Cleanup plan" description="Each file is counted once, even when evidence overlaps." />

      <div className="measure-strip" aria-label="Plan totals">
        <div><span>Selected</span><strong className="numeric">{formatBytes(plan.selectedBytes)}</strong></div>
        <div><span>Target</span><strong className="numeric">{plan.targetBytes == null ? 'None' : formatBytes(plan.targetBytes)}</strong></div>
        <div className={plan.shortfallBytes > 0 ? 'measure-strip__review' : 'measure-strip__success'}>
          <span>Status</span><strong>{plan.shortfallBytes > 0 ? `${formatBytes(plan.shortfallBytes)} short` : 'Target met'}</strong>
        </div>
      </div>

      {plan.shortfallBytes > 0 && (
        <InlineNotice title="The current selection is below target" tone="review">
          You can continue with a partial cleanup or adjust the current scopes. Nothing else is added automatically.
        </InlineNotice>
      )}

      <section className="screen-section" aria-labelledby="evidence-groups-heading">
        <div className="section-heading"><div><h2 id="evidence-groups-heading">Evidence groups</h2><p>Open a group to inspect source facts and file choices.</p></div></div>
        <div className="grouped-list">
          {groups.map((group) => <PlanGroupRow key={group.id} {...group} onOpen={onOpenGroup} onToggle={onToggleGroup} />)}
        </div>
      </section>

      <section className="screen-section" aria-labelledby="plan-protection-heading">
        <div className="section-heading"><div><h2 id="plan-protection-heading">Protected by this plan</h2><p>Protection wins over every cleanup category.</p></div></div>
        <div className="grouped-list">{protections.map((protection) => <ProtectionRow key={protection.scope} {...protection} />)}</div>
      </section>

      <BottomActionBar
        selectedBytes={plan.selectedBytes}
        selectedCount={selectedCount}
        targetBytes={plan.targetBytes}
        shortfallBytes={plan.shortfallBytes}
        primaryLabel="Review selection"
        onPrimary={onReview}
        primaryDisabled={selectedCount === 0}
        secondaryLabel="Adjust"
        onSecondary={onAdjustConstraints}
      />
    </div>
  )
}
