import type { CreateTrainingSessionInput, TrainingSession } from './types.ts'

export const TRAINING_SESSIONS_PATH = '/api/training-sessions'

export class TrainingSessionsApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'TrainingSessionsApiError'
    this.status = status
  }
}

function resolveUrl(): string {
  return new URL(TRAINING_SESSIONS_PATH, window.location.origin).toString()
}

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

/**
 * Converts a `datetime-local` value (`"2026-04-14T09:00"`) to an ISO 8601 instant.
 *
 * The wall clock the trainer types is interpreted as UTC, because the list pins
 * `timeZone: 'UTC'` when formatting `startsAt`. Parsing the value as host-local
 * time instead would shift a created session by the host offset and render a
 * time the trainer never entered.
 */
export function toIsoStartsAt(localValue: string): string {
  const match = DATETIME_LOCAL_PATTERN.exec(localValue.trim())

  if (match === null) {
    return new Date(localValue).toISOString()
  }

  const [, year, month, day, hours, minutes, seconds] = match

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      seconds === undefined ? 0 : Number(seconds),
    ),
  ).toISOString()
}

export async function fetchTrainingSessions(
  signal?: AbortSignal,
): Promise<TrainingSession[]> {
  const response = await fetch(resolveUrl(), {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new TrainingSessionsApiError(
      'Could not load training sessions.',
      response.status,
    )
  }

  return (await response.json()) as TrainingSession[]
}

export async function createTrainingSession(
  input: CreateTrainingSessionInput,
): Promise<TrainingSession> {
  const response = await fetch(resolveUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      title: input.title.trim(),
      startsAt: toIsoStartsAt(input.startsAt),
    }),
  })

  if (!response.ok) {
    throw new TrainingSessionsApiError(
      'Could not create the training session.',
      response.status,
    )
  }

  return (await response.json()) as TrainingSession
}
