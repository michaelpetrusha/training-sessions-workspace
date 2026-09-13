import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createTrainingSession } from './api.ts'
import { validateCreateForm } from './validation.ts'
import type { CreateFormErrors } from './validation.ts'
import type { CreateTrainingSessionInput, TrainingSession } from './types.ts'

export const CREATE_FAILED_MESSAGE =
  'Could not create the training session. Please try again.'

const TITLE_ID = 'training-session-title'
const TITLE_ERROR_ID = 'training-session-title-error'
const STARTS_AT_ID = 'training-session-starts-at'
const STARTS_AT_ERROR_ID = 'training-session-starts-at-error'

const EMPTY_VALUES: CreateTrainingSessionInput = { title: '', startsAt: '' }

type CreateTrainingSessionFormProps = {
  onCreated: (session: TrainingSession) => void
  onCancel: () => void
}

export function CreateTrainingSessionForm({
  onCreated,
  onCancel,
}: CreateTrainingSessionFormProps) {
  const [values, setValues] = useState<CreateTrainingSessionInput>(EMPTY_VALUES)
  const [errors, setErrors] = useState<CreateFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateCreateForm(values, new Date())
    setErrors(nextErrors)
    setSubmitError(null)

    if (nextErrors.title !== undefined || nextErrors.startsAt !== undefined) {
      titleRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      const created = await createTrainingSession(values)
      setValues(EMPTY_VALUES)
      onCreated(created)
    } catch {
      setSubmitError(CREATE_FAILED_MESSAGE)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="training-sessions__form" onSubmit={handleSubmit} noValidate>
      <h2>New training session</h2>

      {submitError === null ? null : (
        <p className="training-sessions__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="training-sessions__fields">
        <div className="training-sessions__field">
          <label htmlFor={TITLE_ID}>Title</label>
          <input
            id={TITLE_ID}
            name="title"
            type="text"
            ref={titleRef}
            autoFocus
            value={values.title}
            aria-invalid={errors.title !== undefined}
            aria-describedby={errors.title === undefined ? undefined : TITLE_ERROR_ID}
            onChange={(event) =>
              setValues((current) => ({ ...current, title: event.target.value }))
            }
          />
          {errors.title === undefined ? null : (
            <p className="training-sessions__error" id={TITLE_ERROR_ID} role="alert">
              {errors.title}
            </p>
          )}
        </div>

        <div className="training-sessions__field">
          <label htmlFor={STARTS_AT_ID}>Start date and time</label>
          <input
            id={STARTS_AT_ID}
            name="startsAt"
            type="datetime-local"
            value={values.startsAt}
            aria-invalid={errors.startsAt !== undefined}
            aria-describedby={
              errors.startsAt === undefined ? undefined : STARTS_AT_ERROR_ID
            }
            onChange={(event) =>
              setValues((current) => ({ ...current, startsAt: event.target.value }))
            }
          />
          {errors.startsAt === undefined ? null : (
            <p
              className="training-sessions__error"
              id={STARTS_AT_ERROR_ID}
              role="alert"
            >
              {errors.startsAt}
            </p>
          )}
        </div>
      </div>

      <div className="training-sessions__actions">
        <button
          className="training-sessions__button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating…' : 'Create session'}
        </button>
        <button
          className="training-sessions__button training-sessions__button--secondary"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
