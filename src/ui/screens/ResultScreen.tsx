import { CheckCircle2, CircleAlert, Search, ShieldCheck } from 'lucide-react'
import type { CleanupResult, DemoFile } from '../../contracts'
import type { FollowUpView, ResultCheckView } from '../types'
import { formatBytes, formatDate } from '../format'
import { Button, EvidenceChip, InlineNotice, PageHeading } from '../components/Primitives'
import { FileRow } from '../components/Rows'

export interface ResultScreenProps {
  result: CleanupResult
  removedFiles: DemoFile[]
  checks: ResultCheckView[]
  inventoryFileCount: number
  inventoryBytes: number
  followUp: FollowUpView
  onFollowUpChange: (question: string) => void
  onAskFollowUp: () => void
  onViewStorage: () => void
  onStartOver: () => void
}

export function ResultScreen({
  result,
  removedFiles,
  checks,
  inventoryFileCount,
  inventoryBytes,
  followUp,
  onFollowUpChange,
  onAskFollowUp,
  onViewStorage,
  onStartOver,
}: ResultScreenProps) {
  const allChecksPassed = checks.every((check) => check.passed)
  return (
    <div className="screen screen--result">
      <PageHeading title="Demo inventory updated" description={`Completed ${formatDate(result.completedAt)}. No device files were changed.`} aside={<EvidenceChip tone="proven">Simulation complete</EvidenceChip>} />

      <div className="result-measure">
        <CheckCircle2 aria-hidden="true" />
        <div><span>Simulated logical space reclaimed</span><strong className="numeric">{formatBytes(result.removedBytes)}</strong><p>{result.removedIds.length} sample {result.removedIds.length === 1 ? 'record' : 'records'} removed</p></div>
      </div>

      <section className="screen-section" aria-labelledby="checks-heading">
        <div className="section-heading"><div><h2 id="checks-heading">Protection checks</h2><p>Compared across demo inventory revisions {result.beforeRevision} and {result.afterRevision}.</p></div></div>
        <div className="check-list">
          {checks.map((check) => (
            <div className={check.passed ? 'check-row check-row--passed' : 'check-row check-row--failed'} key={check.key}>
              {check.passed ? <ShieldCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
              <span><strong>{check.label}</strong>{check.detail && <small>{check.detail}</small>}</span>
              <b>{check.passed ? 'Passed' : 'Needs review'}</b>
            </div>
          ))}
        </div>
      </section>

      {!allChecksPassed && <InlineNotice title="Review the updated inventory" tone="review">One or more expected protection checks did not pass in the simulation.</InlineNotice>}

      <section className="inventory-summary inventory-summary--compact" aria-labelledby="updated-inventory-heading">
        <div><div><h2 id="updated-inventory-heading">Current demo inventory</h2><p>{inventoryFileCount} sample files remain</p></div></div>
        <strong className="numeric">{formatBytes(inventoryBytes)}</strong>
        <Button variant="quiet" type="button" onClick={onViewStorage}>View storage</Button>
      </section>

      {removedFiles.length > 0 && (
        <details className="disclosure">
          <summary>Files removed from the demo</summary>
          <div className="grouped-list">{removedFiles.map((file) => <FileRow key={file.id} file={file} evidence={[]} />)}</div>
        </details>
      )}

      <section className="follow-up" aria-labelledby="follow-up-heading">
        <h2 id="follow-up-heading">Ask about what remains</h2>
        <p>Answers come from the updated demo inventory.</p>
        <form onSubmit={(event) => { event.preventDefault(); onAskFollowUp() }}>
          <label className="sr-only" htmlFor="follow-up-question">Follow-up question</label>
          <input id="follow-up-question" value={followUp.question} onChange={(event) => onFollowUpChange(event.currentTarget.value)} placeholder="How many BEE lab-record copies remain?" />
          <Button type="submit" disabled={!followUp.question.trim()} isLoading={followUp.isLoading}><Search aria-hidden="true" /> Ask</Button>
        </form>
        {followUp.answer && <div className="follow-up__answer" aria-live="polite"><strong>Current inventory</strong><p>{followUp.answer}</p></div>}
      </section>

      <div className="screen-actions"><Button variant="secondary" type="button" onClick={onStartOver}>Start another request</Button></div>
    </div>
  )
}
