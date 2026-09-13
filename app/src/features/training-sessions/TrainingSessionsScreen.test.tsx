import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { TrainingSessionsScreen } from './TrainingSessionsScreen.tsx'
import { LOADING_MESSAGE } from './TrainingSessionsScreen.tsx'
import { TRAINING_SESSIONS_PATH } from './api.ts'
import { server } from '../../mocks/server.ts'

async function renderLoadedScreen() {
  const user = userEvent.setup()
  render(<TrainingSessionsScreen />)
  await waitFor(() => {
    expect(screen.queryByText(LOADING_MESSAGE)).not.toBeInTheDocument()
  })
  return user
}

function rows() {
  return screen.queryAllByRole('listitem')
}

describe('TrainingSessionsScreen status filter', () => {
  it('filters the fetched collection in memory without issuing another request', async () => {
    const user = await renderLoadedScreen()
    expect(rows()).toHaveLength(8)

    const requestSpy = vi.fn()
    server.events.on('request:start', requestSpy)

    try {
      await user.selectOptions(screen.getByLabelText('Status'), 'completed')

      const completedRows = rows()
      expect(completedRows).toHaveLength(3)
      for (const row of completedRows) {
        expect(within(row).getByText('completed')).toBeInTheDocument()
      }
      expect(requestSpy).not.toHaveBeenCalled()

      await user.selectOptions(screen.getByLabelText('Status'), 'all')
      expect(rows()).toHaveLength(8)
      expect(requestSpy).not.toHaveBeenCalled()
    } finally {
      server.events.removeListener('request:start', requestSpy)
    }
  })
})

describe('TrainingSessionsScreen creation', () => {
  it('creates a session, disables submit while in flight, and shows the new row', async () => {
    let releaseResponse = () => {}
    const pending = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })

    server.use(
      http.post(TRAINING_SESSIONS_PATH, async () => {
        await pending
        return HttpResponse.json(
          {
            id: 'ts-created',
            title: 'Evening Conditioning',
            startsAt: '2099-01-01T09:00:00.000Z',
            status: 'scheduled',
          },
          { status: 201 },
        )
      }),
    )

    const user = await renderLoadedScreen()

    const toggle = screen.getByRole('button', { name: 'New training session' })
    await user.click(toggle)

    await user.type(screen.getByLabelText('Title'), 'Evening Conditioning')
    const startsAt = screen.getByLabelText('Start date and time')
    fireEvent.change(startsAt, { target: { value: '2099-01-01T09:00' } })
    expect(startsAt).toHaveValue('2099-01-01T09:00')

    const submit = screen.getByRole('button', { name: 'Create session' })
    await user.click(submit)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled()
    })

    releaseResponse()

    const newRow = await screen.findByText('Evening Conditioning')
    expect(within(newRow.closest('li') as HTMLElement).getByText('scheduled')).toBeInTheDocument()
    expect(rows()).toHaveLength(9)
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
