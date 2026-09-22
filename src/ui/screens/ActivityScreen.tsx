import { CheckCircle2, Clock3, History } from 'lucide-react'
import type { ActivityDayView } from '../types'
import { PageHeading } from '../components/Primitives'

export interface ActivityScreenProps {
  days: ActivityDayView[]
}

export function ActivityScreen({ days }: ActivityScreenProps) {
  return (
    <div className="screen">
      <PageHeading title="Demo activity" description="A plain record of interpretation, planning, cleanup simulations, and resets." />
      {days.length === 0 ? (
        <div className="empty-state"><History aria-hidden="true" /><h2>No activity yet</h2><p>Build a cleanup plan to start the demo history.</p></div>
      ) : (
        <div className="activity-list">
          {days.map((day) => (
            <section key={day.label} aria-labelledby={`activity-${day.label.replace(/\s+/g, '-').toLowerCase()}`}>
              <h2 id={`activity-${day.label.replace(/\s+/g, '-').toLowerCase()}`}>{day.label}</h2>
              <ol>
                {day.entries.map((entry) => (
                  <li key={entry.id}>
                    <span className="activity-list__marker"><CheckCircle2 aria-hidden="true" /></span>
                    <div><strong>{entry.title}</strong><p>{entry.detail}</p><time dateTime={entry.at}><Clock3 aria-hidden="true" /> {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(entry.at))}</time></div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
