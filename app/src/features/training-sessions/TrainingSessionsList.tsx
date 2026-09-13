import { formatStartsAt } from './formatting.ts'
import type { TrainingSession } from './types.ts'

export const EMPTY_COLLECTION_MESSAGE = 'No training sessions yet'
export const EMPTY_FILTER_MESSAGE = 'No training sessions match this status'

export type EmptyVariant = 'collection' | 'filtered'

type TrainingSessionsListProps = {
  sessions: TrainingSession[]
  emptyVariant: EmptyVariant
}

export function TrainingSessionsList({
  sessions,
  emptyVariant,
}: TrainingSessionsListProps) {
  if (sessions.length === 0) {
    return (
      <p className="training-sessions__empty">
        {emptyVariant === 'filtered'
          ? EMPTY_FILTER_MESSAGE
          : EMPTY_COLLECTION_MESSAGE}
      </p>
    )
  }

  return (
    <ul className="training-sessions__list">
      {sessions.map((session) => (
        <li key={session.id} className="training-sessions__row">
          <span className="training-sessions__row-title">{session.title}</span>
          <time className="training-sessions__row-time" dateTime={session.startsAt}>
            {formatStartsAt(session.startsAt)}
          </time>
          <span className="training-sessions__status">{session.status}</span>
        </li>
      ))}
    </ul>
  )
}
