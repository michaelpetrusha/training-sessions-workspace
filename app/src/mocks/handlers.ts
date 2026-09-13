import { http, HttpResponse } from 'msw'
import { addToStore, getStore } from './seed.ts'
import { TRAINING_SESSIONS_PATH } from '../features/training-sessions/api.ts'
import type { TrainingSession } from '../features/training-sessions/types.ts'

type CreateRequestBody = {
  title?: unknown
  startsAt?: unknown
}

export const handlers = [
  http.get(TRAINING_SESSIONS_PATH, () => HttpResponse.json(getStore())),

  http.post(TRAINING_SESSIONS_PATH, async ({ request }) => {
    const body = (await request.json()) as CreateRequestBody

    if (typeof body.title !== 'string' || typeof body.startsAt !== 'string') {
      return HttpResponse.json({ message: 'Invalid training session payload.' }, { status: 400 })
    }

    const created: TrainingSession = {
      id: crypto.randomUUID(),
      title: body.title,
      startsAt: body.startsAt,
      status: 'scheduled',
    }

    addToStore(created)

    return HttpResponse.json(created, { status: 201 })
  }),
]
