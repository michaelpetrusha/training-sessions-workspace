import { useCallback, useEffect, useState } from 'react'
import { fetchTrainingSessions } from './api.ts'
import type { TrainingSession } from './types.ts'

type TrainingSessionsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; sessions: TrainingSession[] }

export type UseTrainingSessionsResult = TrainingSessionsState & {
  reload: () => void
  addSession: (session: TrainingSession) => void
}

const LOAD_ERROR_MESSAGE = 'Could not load training sessions.'

export function useTrainingSessions(): UseTrainingSessionsResult {
  const [state, setState] = useState<TrainingSessionsState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetchTrainingSessions(controller.signal)
      .then((sessions) => {
        if (controller.signal.aborted) {
          return
        }

        setState({ status: 'ready', sessions })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const message =
          error instanceof Error && error.message.length > 0
            ? error.message
            : LOAD_ERROR_MESSAGE

        setState({ status: 'error', message })
      })

    return () => {
      controller.abort()
    }
  }, [reloadToken])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setReloadToken((token) => token + 1)
  }, [])

  const addSession = useCallback((session: TrainingSession) => {
    setState((current) => {
      if (current.status !== 'ready') {
        return current
      }

      return { status: 'ready', sessions: [...current.sessions, session] }
    })
  }, [])

  return { ...state, reload, addSession }
}
