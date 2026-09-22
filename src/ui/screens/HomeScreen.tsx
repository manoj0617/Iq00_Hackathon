import { Clock3, Database, Search } from 'lucide-react'
import { formatBytes, formatDate } from '../format'
import { Button, InlineNotice, PageHeading } from '../components/Primitives'

export interface HomeExample {
  id: string
  label: string
  request: string
}

export interface HomeScreenProps {
  request: string
  onRequestChange: (request: string) => void
  onSubmit: () => void
  examples: HomeExample[]
  onChooseExample: (request: string) => void
  fileCount: number
  totalBytes: number
  updatedAt: string
  persistenceNotice?: string | null
  isSubmitting?: boolean
  error?: string | null
}

export function HomeScreen({
  request,
  onRequestChange,
  onSubmit,
  examples,
  onChooseExample,
  fileCount,
  totalBytes,
  updatedAt,
  persistenceNotice,
  isSubmitting = false,
  error,
}: HomeScreenProps) {
  return (
    <div className="screen screen--home">
      <PageHeading
        title="Make room with a plan you can inspect"
        description="Describe what to protect and where to start. The demo builds a reviewable plan over sample files."
      />

      {persistenceNotice && <InlineNotice title="Demo state was reset">{persistenceNotice}</InlineNotice>}

      <form
        className="command-surface"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label htmlFor="cleanup-request">What should be cleared?</label>
        <textarea
          id="cleanup-request"
          value={request}
          onChange={(event) => onRequestChange(event.currentTarget.value)}
          placeholder="Free at least 1 GB. Keep Semester 2 and Camera photos."
          rows={5}
          aria-describedby="request-disclosure request-error"
        />
        <p id="request-disclosure" className="field-help">Demo interpretation supports targets, exact duplicates, Semester 1, Semester 2, Camera, and Downloads.</p>
        {error && <p id="request-error" className="field-error" role="alert">{error}</p>}
        <Button type="submit" disabled={!request.trim()} isLoading={isSubmitting}>
          <Search aria-hidden="true" />
          Inspect request
        </Button>
      </form>

      <section className="screen-section" aria-labelledby="example-heading">
        <h2 id="example-heading">Try a supported request</h2>
        <div className="choice-list">
          {examples.map((example) => (
            <button key={example.id} className="choice-chip" type="button" onClick={() => onChooseExample(example.request)}>
              {example.label}
            </button>
          ))}
        </div>
      </section>

      <section className="inventory-summary" aria-labelledby="inventory-heading">
        <div>
          <Database aria-hidden="true" />
          <div>
            <h2 id="inventory-heading">Current demo inventory</h2>
            <p>{fileCount} sample files indexed</p>
          </div>
        </div>
        <strong className="numeric">{formatBytes(totalBytes)}</strong>
        <p className="inventory-summary__updated"><Clock3 aria-hidden="true" /> Updated {formatDate(updatedAt)}</p>
      </section>
    </div>
  )
}
