import { ArrowLeft, ShieldCheck } from 'lucide-react'
import type { FileRowView } from '../types'
import { formatBytes } from '../format'
import { Button, EvidenceChip, InlineNotice, PageHeading } from '../components/Primitives'
import { FileRow } from '../components/Rows'

export interface EvidenceDetailScreenProps {
  title: string
  description: string
  evidenceLabel: string
  totalBytes: number
  files: FileRowView[]
  retainedSummary?: string
  onToggleFile: (fileId: string, selected: boolean) => void
  onBack: () => void
}

export function EvidenceDetailScreen({
  title,
  description,
  evidenceLabel,
  totalBytes,
  files,
  retainedSummary,
  onToggleFile,
  onBack,
}: EvidenceDetailScreenProps) {
  return (
    <div className="screen">
      <button className="text-action" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back to plan</button>
      <PageHeading title={title} description={description} aside={<strong className="numeric">{formatBytes(totalBytes)}</strong>} />
      <div className="chip-row"><EvidenceChip tone="proven">Fixture evidence</EvidenceChip><EvidenceChip tone="metadata">{evidenceLabel}</EvidenceChip></div>
      {retainedSummary && <InlineNotice title="A copy stays in the demo inventory" tone="info"><p>{retainedSummary}</p></InlineNotice>}
      <section className="screen-section" aria-labelledby="detail-files-heading">
        <div className="section-heading"><div><h2 id="detail-files-heading">Files in this group</h2><p>Selection changes update the plan totals outside this view.</p></div><ShieldCheck aria-hidden="true" /></div>
        <div className="grouped-list">
          {files.map((row) => <FileRow key={row.file.id} {...row} onToggle={onToggleFile} />)}
        </div>
      </section>
      <div className="screen-actions"><Button type="button" onClick={onBack}>Done</Button></div>
    </div>
  )
}
