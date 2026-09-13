import { describe, expect, it } from 'vitest'
import {
  STARTS_AT_INVALID_MESSAGE,
  STARTS_AT_PAST_MESSAGE,
  STARTS_AT_REQUIRED_MESSAGE,
  TITLE_RANGE_MESSAGE,
  TITLE_REQUIRED_MESSAGE,
  validateCreateForm,
  validateStartsAt,
  validateTitle,
} from './validation.ts'

const NOW = new Date('2026-05-01T10:00:00.000Z')

describe('validateTitle', () => {
  it('rejects an empty or whitespace-only title', () => {
    expect(validateTitle('')).toBe(TITLE_REQUIRED_MESSAGE)
    expect(validateTitle('   ')).toBe(TITLE_REQUIRED_MESSAGE)
  })

  it('rejects a trimmed title shorter than 3 characters', () => {
    expect(validateTitle('ab')).toBe(TITLE_RANGE_MESSAGE)
  })

  it('rejects a title whose untrimmed length passes but trimmed length fails', () => {
    expect(validateTitle('  ab  ')).toBe(TITLE_RANGE_MESSAGE)
  })

  it('accepts the 3 and 80 character boundaries', () => {
    expect(validateTitle('abc')).toBeNull()
    expect(validateTitle('a'.repeat(80))).toBeNull()
  })

  it('rejects 81 characters', () => {
    expect(validateTitle('a'.repeat(81))).toBe(TITLE_RANGE_MESSAGE)
  })
})

describe('validateStartsAt', () => {
  it('rejects an empty value', () => {
    expect(validateStartsAt('', NOW)).toBe(STARTS_AT_REQUIRED_MESSAGE)
  })

  it('rejects an unparseable value', () => {
    expect(validateStartsAt('not-a-date', NOW)).toBe(STARTS_AT_INVALID_MESSAGE)
  })

  it('rejects a value exactly equal to now', () => {
    expect(validateStartsAt(NOW.toISOString(), NOW)).toBe(STARTS_AT_PAST_MESSAGE)
  })

  it('rejects a past value', () => {
    expect(validateStartsAt('2026-04-30T10:00:00.000Z', NOW)).toBe(
      STARTS_AT_PAST_MESSAGE,
    )
  })

  it('accepts a value one second after now', () => {
    expect(
      validateStartsAt(new Date(NOW.getTime() + 1000).toISOString(), NOW),
    ).toBeNull()
  })
})

describe('validateCreateForm', () => {
  it('reports both field errors for empty values', () => {
    expect(validateCreateForm({ title: '', startsAt: '' }, NOW)).toEqual({
      title: TITLE_REQUIRED_MESSAGE,
      startsAt: STARTS_AT_REQUIRED_MESSAGE,
    })
  })

  it('reports no errors for valid values', () => {
    expect(
      validateCreateForm(
        { title: 'Morning Strength', startsAt: '2099-01-01T09:00' },
        NOW,
      ),
    ).toEqual({})
  })
})
