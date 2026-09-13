import { useMemo, useRef, useState } from 'react'
import { CreateTrainingSessionForm } from './CreateTrainingSessionForm.tsx'
import { StatusFilter } from './StatusFilter.tsx'
import { TrainingSessionsList } from './TrainingSessionsList.tsx'
import { useTrainingSessions } from './useTrainingSessions.ts'
import type { StatusFilterValue } from './StatusFilter.tsx'
import type { TrainingSession } from './types.ts'
import './trainingSessions.css'

export const LOADING_MESSAGE = 'Loading training sessions…'

export function TrainingSessionsScreen() {
  const sessions = useTrainingSessions()
  const [filter, setFilter] = useState<StatusFilterValue>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const readySessions = sessions.status === 'ready' ? sessions.sessions : null

  const visibleSessions = useMemo(() => {
    if (readySessions === null) {
      return []
    }

    if (filter === 'all') {
      return readySessions
    }

    return readySessions.filter((session) => session.status === filter)
  }, [readySessions, filter])

  function closeForm() {
    setIsFormOpen(false)
    toggleRef.current?.focus()
  }

  function handleCreated(session: TrainingSession) {
    sessions.addSession(session)
    closeForm()
  }

  return (
    <div className="training-sessions">
      <div className="training-sessions__toolbar">
        <StatusFilter value={filter} onChange={setFilter} />
        <button
          className="training-sessions__button"
          type="button"
          ref={toggleRef}
          aria-expanded={isFormOpen}
          onClick={() => setIsFormOpen((open) => !open)}
        >
          New training session
        </button>
      </div>

      {isFormOpen ? (
        <section aria-label="New training session">
          <CreateTrainingSessionForm
            onCreated={handleCreated}
            onCancel={closeForm}
          />
        </section>
      ) : null}

      {sessions.status === 'loading' ? (
        <p className="training-sessions__loading" role="status">
          {LOADING_MESSAGE}
        </p>
      ) : null}

      {sessions.status === 'error' ? (
        <div role="alert">
          <p className="training-sessions__error">{sessions.message}</p>
          <button
            className="training-sessions__button"
            type="button"
            onClick={sessions.reload}
          >
            Retry
          </button>
        </div>
      ) : null}

      {sessions.status === 'ready' ? (
        <TrainingSessionsList
          sessions={visibleSessions}
          emptyVariant={filter === 'all' ? 'collection' : 'filtered'}
        />
      ) : null}
    </div>
  )
}
