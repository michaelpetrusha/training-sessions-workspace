import type { TrainingSession } from '../features/training-sessions/types.ts'

export const SEED_SESSIONS: readonly TrainingSession[] = [
  { id: 'ts-1', title: 'Morning Strength', startsAt: '2026-04-14T09:00:00.000Z', status: 'scheduled' },
  { id: 'ts-2', title: 'Evening Mobility', startsAt: '2026-04-15T17:30:00.000Z', status: 'scheduled' },
  { id: 'ts-3', title: 'Endurance Run', startsAt: '2026-04-18T07:15:00.000Z', status: 'scheduled' },
  { id: 'ts-4', title: 'Intro To Barbell', startsAt: '2026-01-12T10:00:00.000Z', status: 'completed' },
  { id: 'ts-5', title: 'Recovery Yoga', startsAt: '2026-01-20T18:45:00.000Z', status: 'completed' },
  { id: 'ts-6', title: 'Sprint Intervals', startsAt: '2026-02-03T06:30:00.000Z', status: 'completed' },
  { id: 'ts-7', title: 'Open Gym', startsAt: '2026-02-11T12:00:00.000Z', status: 'cancelled' },
  { id: 'ts-8', title: 'Team Circuit', startsAt: '2026-02-24T19:00:00.000Z', status: 'cancelled' },
]

let store: TrainingSession[] = [...SEED_SESSIONS]

export function getStore(): TrainingSession[] {
  return store
}

export function addToStore(session: TrainingSession): void {
  store.push(session)
}

export function resetStore(): void {
  store = [...SEED_SESSIONS]
}
