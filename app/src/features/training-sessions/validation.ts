import type { CreateTrainingSessionInput } from './types.ts'

export const TITLE_MIN_LENGTH = 3
export const TITLE_MAX_LENGTH = 80

export const TITLE_REQUIRED_MESSAGE = 'Title is required.'
export const TITLE_RANGE_MESSAGE = `Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters.`
export const STARTS_AT_REQUIRED_MESSAGE = 'Start date and time is required.'
export const STARTS_AT_INVALID_MESSAGE = 'Start date and time is not a valid date.'
export const STARTS_AT_PAST_MESSAGE = 'Start date and time must be in the future.'

export type CreateFormErrors = {
  title?: string
  startsAt?: string
}

export function validateTitle(raw: string): string | null {
  const trimmed = raw.trim()

  if (trimmed.length === 0) {
    return TITLE_REQUIRED_MESSAGE
  }

  if (trimmed.length < TITLE_MIN_LENGTH || trimmed.length > TITLE_MAX_LENGTH) {
    return TITLE_RANGE_MESSAGE
  }

  return null
}

export function validateStartsAt(raw: string, now: Date): string | null {
  if (raw.trim().length === 0) {
    return STARTS_AT_REQUIRED_MESSAGE
  }

  const parsed = new Date(raw)

  if (Number.isNaN(parsed.getTime())) {
    return STARTS_AT_INVALID_MESSAGE
  }

  if (parsed.getTime() <= now.getTime()) {
    return STARTS_AT_PAST_MESSAGE
  }

  return null
}

export function validateCreateForm(
  values: CreateTrainingSessionInput,
  now: Date,
): CreateFormErrors {
  const errors: CreateFormErrors = {}
  const title = validateTitle(values.title)
  const startsAt = validateStartsAt(values.startsAt, now)

  if (title !== null) {
    errors.title = title
  }

  if (startsAt !== null) {
    errors.startsAt = startsAt
  }

  return errors
}
