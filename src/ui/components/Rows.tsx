import { ChevronRight, FileText, LockKeyhole, ShieldCheck } from 'lucide-react'
import { formatBytes, formatDate } from '../format'
import type { FileRowView, PlanGroupView, ProtectionView } from '../types'
import { EvidenceChip } from './Primitives'

function evidenceTone(kind: FileRowView['evidence'][number]['kind']): 'proven' | 'directed' | 'review' {
  if (kind === 'duplicate') return 'proven'
  if (kind === 'folder') return 'directed'
  return 'review'
}

export interface FileRowProps extends FileRowView {
  onToggle?: (fileId: string, selected: boolean) => void
  onOpen?: (fileId: string) => void
  disabled?: boolean
}

export function FileRow({
  file,
  evidence,
  selected = false,
  protected: isProtected = false,
  retained = false,
  selectionLabel,
  onToggle,
  onOpen,
  disabled = false,
}: FileRowProps) {
  const cannotSelect = disabled || isProtected || retained

  return (
    <div className="file-row">
      {onToggle ? (
        <label className="selection-control">
          <input
            type="checkbox"
            checked={selected}
            disabled={cannotSelect}
            onChange={(event) => onToggle(file.id, event.currentTarget.checked)}
            aria-label={selectionLabel ?? `${selected ? 'Deselect' : 'Select'} ${file.name}`}
          />
          <span aria-hidden="true" />
        </label>
      ) : (
        <FileText className="file-row__icon" aria-hidden="true" />
      )}
      <div className="file-row__body">
        <div className="file-row__heading">
          <strong title={file.name}>{file.name}</strong>
          <span className="numeric">{formatBytes(file.bytes)}</span>
        </div>
        <p className="file-row__path" title={file.path}>{file.path}</p>
        <p className="file-row__meta">Modified {formatDate(file.modifiedAt)}</p>
        <div className="chip-row">
          {isProtected && <EvidenceChip tone="protected">Protected</EvidenceChip>}
          {retained && <EvidenceChip tone="metadata">Retained copy</EvidenceChip>}
          {evidence.map((item) => (
            <EvidenceChip key={`${item.kind}-${item.label}`} tone={evidenceTone(item.kind)}>
              {item.label}
            </EvidenceChip>
          ))}
        </div>
      </div>
      {onOpen && (
        <button className="row-action" type="button" onClick={() => onOpen(file.id)} aria-label={`Inspect ${file.name}`}>
          <ChevronRight aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export interface PlanGroupRowProps extends PlanGroupView {
  onOpen: (groupId: string) => void
  onToggle?: (groupId: string, selected: boolean) => void
}

export function PlanGroupRow({
  id,
  title,
  description,
  itemCount,
  selectedCount,
  selectedBytes,
  evidenceTone,
  evidenceLabel,
  selected = false,
  reviewRequired = false,
  onOpen,
  onToggle,
}: PlanGroupRowProps) {
  return (
    <div className="plan-group-row">
      <div className="plan-group-row__main">
        {onToggle && (
          <label className="selection-control">
            <input
              type="checkbox"
              checked={selected}
              onChange={(event) => onToggle(id, event.currentTarget.checked)}
              aria-label={`${selected ? 'Deselect' : 'Select'} ${title}`}
            />
            <span aria-hidden="true" />
          </label>
        )}
        <div>
          <div className="plan-group-row__heading">
            <h2>{title}</h2>
            <strong className="numeric">{formatBytes(selectedBytes)}</strong>
          </div>
          <p>{description}</p>
          <p className="plan-group-row__count">{selectedCount} of {itemCount} selected</p>
          <div className="chip-row">
            <EvidenceChip tone={evidenceTone}>{evidenceLabel}</EvidenceChip>
            {reviewRequired && <EvidenceChip tone="review">Review required</EvidenceChip>}
          </div>
        </div>
      </div>
      <button className="row-action" type="button" onClick={() => onOpen(id)} aria-label={`Review ${title}`}>
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  )
}

export function ProtectionRow({ label, detail, coveredCount }: ProtectionView) {
  return (
    <div className="protection-row">
      <span className="protection-row__icon"><LockKeyhole aria-hidden="true" /></span>
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
      <span className="protection-row__count"><ShieldCheck aria-hidden="true" /> {coveredCount} protected</span>
    </div>
  )
}
