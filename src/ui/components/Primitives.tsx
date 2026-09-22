import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AlertTriangle, Check, Info, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { EvidenceTone } from '../types'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'quiet'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  children,
  className = '',
  variant = 'primary',
  isLoading = false,
  disabled,
  ...props
}: ButtonProps, ref) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <span className="button__loader" aria-hidden="true" />}
      <span>{isLoading ? 'Working…' : children}</span>
    </button>
  )
})

const evidenceIcons = {
  proven: Check,
  directed: Info,
  review: AlertTriangle,
  protected: LockKeyhole,
  metadata: ShieldCheck,
}

export interface EvidenceChipProps {
  children: ReactNode
  tone?: EvidenceTone
}

export function EvidenceChip({ children, tone = 'metadata' }: EvidenceChipProps) {
  const Icon = evidenceIcons[tone]
  return (
    <span className={`evidence-chip evidence-chip--${tone}`}>
      <Icon aria-hidden="true" />
      {children}
    </span>
  )
}

export interface InlineNoticeProps {
  title: string
  children: ReactNode
  tone?: 'info' | 'review' | 'error' | 'success'
}

export function InlineNotice({ title, children, tone = 'info' }: InlineNoticeProps) {
  const Icon = tone === 'review' || tone === 'error' ? AlertTriangle : tone === 'success' ? Check : Info
  return (
    <div className={`inline-notice inline-notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </div>
  )
}

export interface PageHeadingProps {
  title: string
  description?: string
  aside?: ReactNode
}

export function PageHeading({ title, description, aside }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {aside && <div className="page-heading__aside">{aside}</div>}
    </div>
  )
}

export function ScreenSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="skeleton" aria-label="Loading content" role="status">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={index === 0 ? 'skeleton__title' : 'skeleton__line'} />
      ))}
    </div>
  )
}
