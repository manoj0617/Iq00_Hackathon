import type { ReactNode } from 'react'
import { formatBytes } from '../format'
import { Button } from './Primitives'

export interface BottomActionBarProps {
  selectedBytes: number
  selectedCount?: number
  targetBytes?: number | null
  shortfallBytes?: number
  primaryLabel: string
  onPrimary: () => void
  primaryDisabled?: boolean
  isLoading?: boolean
  secondaryLabel?: string
  onSecondary?: () => void
  note?: ReactNode
}

export function BottomActionBar({
  selectedBytes,
  selectedCount,
  targetBytes,
  shortfallBytes = 0,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  isLoading = false,
  secondaryLabel,
  onSecondary,
  note,
}: BottomActionBarProps) {
  const targetMet = targetBytes == null || shortfallBytes === 0

  return (
    <div className="bottom-action-bar">
      <div className="bottom-action-bar__summary" aria-live="polite">
        <strong className="numeric">{formatBytes(selectedBytes)}</strong>
        <span>
          {selectedCount != null && `${selectedCount} files · `}
          {targetBytes == null ? 'No size target' : targetMet ? 'Target met' : `${formatBytes(shortfallBytes)} short`}
        </span>
        {note && <div className="bottom-action-bar__note">{note}</div>}
      </div>
      <div className="bottom-action-bar__actions">
        {secondaryLabel && onSecondary && (
          <Button variant="secondary" type="button" onClick={onSecondary}>{secondaryLabel}</Button>
        )}
        <Button type="button" onClick={onPrimary} disabled={primaryDisabled} isLoading={isLoading}>
          {primaryLabel}
        </Button>
      </div>
    </div>
  )
}
