/**
 * ========================================================================
 * FeedbackFab COMPONENT RENDER TESTS
 * ========================================================================
 *
 * Renders the real FeedbackFab and drives the full feedback flow: opening the
 * dialog, submit-button gating (requires rating + comment), category toggles,
 * and the success / API-failure / network-error submission paths. fetch is
 * stubbed directly (MSW disabled for this suite) so no mock-data network layer
 * is involved.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackFab } from '../FeedbackFab'
import { server } from '../../test/mocks/server'

const mockFetch = vi.fn()

// MUI's multiline TextField (TextareaAutosize) constructs a ResizeObserver via
// `new`. The shared setup mock isn't usable as a constructor here, so install a
// real class implementation for this suite.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('FeedbackFab (rendered)', () => {
  beforeAll(() => server.close())
  afterAll(() => server.listen({ onUnhandledRequest: 'error' }))

  beforeEach(() => {
    ;(global as any).ResizeObserver = ResizeObserverMock
    ;(window as any).ResizeObserver = ResizeObserverMock
    mockFetch.mockReset()
    global.fetch = mockFetch as any
  })

  const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: /feedback/i }))
    expect(await screen.findByText('Share Your Feedback')).toBeInTheDocument()
  }

  it('renders the feedback FAB', () => {
    render(<FeedbackFab />)
    expect(screen.getByRole('button', { name: /feedback/i })).toBeInTheDocument()
  })

  it('opens the feedback dialog when the FAB is clicked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<FeedbackFab />)
    await openDialog(user)
    expect(screen.getByText(/Help us improve your weather searching experience/i)).toBeInTheDocument()
  })

  it('keeps the submit button disabled until a rating and comment are provided', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<FeedbackFab />)
    await openDialog(user)

    const submit = screen.getByRole('button', { name: /Submit Feedback/i })
    expect(submit).toBeDisabled()

    fireEvent.click(screen.getByLabelText('4 Stars'))
    expect(submit).toBeDisabled() // still no comment

    await user.type(screen.getByRole("textbox", { name: /Your feedback/i }), 'Great app!')
    expect(submit).toBeEnabled()
  })

  it('submits feedback and shows a success message', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true, message: 'ok' }),
    })
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<FeedbackFab />)
    await openDialog(user)

    fireEvent.click(screen.getByLabelText('5 Stars'))
    await user.type(screen.getByRole("textbox", { name: /Your feedback/i }), 'Loving the POI map')
    await user.click(screen.getByRole('button', { name: /general feedback/i }))
    await user.click(screen.getByRole('button', { name: /Submit Feedback/i }))

    expect(await screen.findByText(/Thank you for your feedback/i)).toBeInTheDocument()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/feedback')
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(body).toMatchObject({
      feedback: 'Loving the POI map',
      rating: 5,
      categories: ['general'],
    })
  })

  it('surfaces an API failure message when the server reports success: false', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Server rejected feedback' }),
    })
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<FeedbackFab />)
    await openDialog(user)

    fireEvent.click(screen.getByLabelText('3 Stars'))
    await user.type(screen.getByRole("textbox", { name: /Your feedback/i }), 'Something is off')
    await user.click(screen.getByRole('button', { name: /Submit Feedback/i }))

    expect(await screen.findByText('Server rejected feedback')).toBeInTheDocument()
  })

  it('shows a generic error message on a network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'))
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<FeedbackFab />)
    await openDialog(user)

    fireEvent.click(screen.getByLabelText('2 Stars'))
    await user.type(screen.getByRole("textbox", { name: /Your feedback/i }), 'Trying to submit')
    await user.click(screen.getByRole('button', { name: /Submit Feedback/i }))

    expect(
      await screen.findByText(/Failed to submit feedback\. Please try again\./i),
    ).toBeInTheDocument()
  })

  it('closes the dialog without submitting when Cancel is clicked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<FeedbackFab />)
    await openDialog(user)

    // The dialog is keepMounted, so it stays in the DOM but becomes hidden.
    await user.click(screen.getByRole('button', { name: /Cancel/i }))
    await waitFor(() =>
      expect(screen.getByText('Share Your Feedback')).not.toBeVisible(),
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
