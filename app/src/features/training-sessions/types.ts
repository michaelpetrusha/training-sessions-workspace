export const STATUS_VALUES = ['scheduled', 'completed', 'cancelled'] as const

export type TrainingSessionStatus = (typeof STATUS_VALUES)[number]

export type TrainingSession = {
  id: string
  title: string
  /** ISO 8601 instant, always with a `Z` offset on the wire. */
  startsAt: string
  status: TrainingSessionStatus
}

export type CreateTrainingSessionInput = {
  title: string
  /** Raw `datetime-local` value, e.g. `"2026-04-14T09:00"`. */
  startsAt: string
}
