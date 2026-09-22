import { ArrowDown, ArrowUp, GripVertical, LockKeyhole } from 'lucide-react'
import type { CandidateScope, ParsedIntent, ProtectedScope } from '../../contracts'
import type { PriorityView } from '../types'
import { Button, EvidenceChip, InlineNotice, PageHeading } from '../components/Primitives'

export interface ProtectionOption {
  scope: ProtectedScope
  label: string
  detail: string
  checked: boolean
}

export interface IntentScreenProps {
  intent: ParsedIntent
  targetValue: string
  targetUnit: 'MB' | 'GB'
  onTargetValueChange: (value: string) => void
  onTargetUnitChange: (unit: 'MB' | 'GB') => void
  protections: ProtectionOption[]
  onToggleProtection: (scope: ProtectedScope, enabled: boolean) => void
  priorities: PriorityView[]
  onMovePriority: (scope: CandidateScope, direction: 'up' | 'down') => void
  onBack: () => void
  onContinue: () => void
  isBuilding?: boolean
  error?: string | null
}

export function IntentScreen({
  intent,
  targetValue,
  targetUnit,
  onTargetValueChange,
  onTargetUnitChange,
  protections,
  onToggleProtection,
  priorities,
  onMovePriority,
  onBack,
  onContinue,
  isBuilding = false,
  error,
}: IntentScreenProps) {
  return (
    <div className="screen">
      <PageHeading title="Review the interpretation" description="These constraints determine the plan. Change them before continuing." aside={<EvidenceChip tone="metadata">Demo interpretation</EvidenceChip>} />

      <blockquote className="original-request">“{intent.originalRequest}”</blockquote>

      {intent.unresolvedTerms.length > 0 && (
        <InlineNotice title="Some wording needs review" tone="review">
          <p>Recognized constraints remain in place. Review: {intent.unresolvedTerms.join(', ')}.</p>
        </InlineNotice>
      )}

      <section className="screen-section" aria-labelledby="target-heading">
        <div className="section-heading">
          <div><h2 id="target-heading">Space target</h2><p>Optional for search-only requests. A targeted plan may be partial if selected files do not reach this amount.</p></div>
        </div>
        <div className="target-control">
          <label htmlFor="target-value">Amount</label>
          <input id="target-value" type="number" min="0" step="0.1" inputMode="decimal" value={targetValue} onChange={(event) => onTargetValueChange(event.currentTarget.value)} />
          <label className="sr-only" htmlFor="target-unit">Unit</label>
          <select id="target-unit" value={targetUnit} onChange={(event) => onTargetUnitChange(event.currentTarget.value as 'MB' | 'GB')}>
            <option value="MB">MB</option>
            <option value="GB">GB</option>
          </select>
        </div>
      </section>

      <section className="screen-section" aria-labelledby="protection-heading">
        <div className="section-heading">
          <div><h2 id="protection-heading">Protected content</h2><p>Protected files are excluded even when they match another scope.</p></div>
          <LockKeyhole aria-hidden="true" />
        </div>
        <div className="setting-list">
          {protections.map((protection) => (
            <label className="setting-row" key={protection.scope}>
              <span><strong>{protection.label}</strong><small>{protection.detail}</small></span>
              <input type="checkbox" role="switch" checked={protection.checked} onChange={(event) => onToggleProtection(protection.scope, event.currentTarget.checked)} />
            </label>
          ))}
        </div>
      </section>

      <section className="screen-section" aria-labelledby="priority-heading">
        <div className="section-heading"><div><h2 id="priority-heading">Cleanup priority</h2><p>The order is explicit and will not expand on its own.</p></div></div>
        <ol className="priority-list">
          {priorities.map((priority, index) => (
            <li key={priority.scope}>
              <GripVertical aria-hidden="true" />
              <span className="priority-list__number">{index + 1}</span>
              <span className="priority-list__copy"><strong>{priority.label}</strong><small>{priority.detail}</small></span>
              <span className="priority-list__actions">
                <button type="button" className="icon-button" onClick={() => onMovePriority(priority.scope, 'up')} disabled={index === 0} aria-label={`Move ${priority.label} earlier`}><ArrowUp aria-hidden="true" /></button>
                <button type="button" className="icon-button" onClick={() => onMovePriority(priority.scope, 'down')} disabled={index === priorities.length - 1} aria-label={`Move ${priority.label} later`}><ArrowDown aria-hidden="true" /></button>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {error && <InlineNotice title="Check these constraints" tone="error">{error}</InlineNotice>}

      <div className="screen-actions">
        <Button variant="secondary" type="button" onClick={onBack}>Back</Button>
        <Button type="button" onClick={onContinue} isLoading={isBuilding}>Build plan</Button>
      </div>
    </div>
  )
}
