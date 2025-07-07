import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils/test-utils'
import { FeedbackForm } from '../FeedbackForm'

// Mock the useFeedbackSubmission hook
vi.mock('../../../hooks/useFeedbackSubmission', () => ({
  useFeedbackSubmission: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  }))
}))

describe('FeedbackForm Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders feedback form when open', () => {
    render(<FeedbackForm open={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Share Your Feedback')).toBeInTheDocument()
    expect(screen.getByText('How would you rate your experience?')).toBeInTheDocument()
    expect(screen.getByLabelText('Feedback Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Your feedback')).toBeInTheDocument()
    expect(screen.getByLabelText('Email (optional)')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<FeedbackForm open={false} onClose={mockOnClose} />)
    
    expect(screen.queryByText('Share Your Feedback')).not.toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<FeedbackForm open={true} onClose={mockOnClose} />)
    
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    expect(submitButton).toBeDisabled()
    
    // Rating is required - button should be disabled until rating is provided
    const ratingInputs = screen.getAllByRole('radio')
    fireEvent.click(ratingInputs[4]) // 5-star rating
    
    // Still disabled because feedback text is required
    expect(submitButton).toBeDisabled()
    
    // Add feedback text
    const feedbackInput = screen.getByLabelText('Your feedback')
    fireEvent.change(feedbackInput, { target: { value: 'Great app!' } })
    
    // Now button should be enabled
    expect(submitButton).not.toBeDisabled()
  })

  it('handles form submission', async () => {
    const mockMutate = vi.fn()
    const { useFeedbackSubmission } = await import('../../../hooks/useFeedbackSubmission')
    vi.mocked(useFeedbackSubmission).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any)

    render(<FeedbackForm open={true} onClose={mockOnClose} />)
    
    // Fill out the form
    const ratingInputs = screen.getAllByRole('radio')
    fireEvent.click(ratingInputs[4]) // 5-star rating
    
    const feedbackInput = screen.getByLabelText('Your feedback')
    fireEvent.change(feedbackInput, { target: { value: 'Excellent service!' } })
    
    const categorySelect = screen.getByLabelText('Feedback Category')
    fireEvent.change(categorySelect, { target: { value: 'feature' } })
    
    const emailInput = screen.getByLabelText('Email (optional)')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Excellent service!',
        category: 'feature',
        email: 'test@example.com'
      })
    })
  })

  it('handles loading state', () => {
    // Use the existing mock from the top level
    const mockUseFeedbackSubmission = vi.mocked(require('../../../hooks/useFeedbackSubmission').useFeedbackSubmission)
    mockUseFeedbackSubmission.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any)

    render(<FeedbackForm open={true} onClose={mockOnClose} />)
    
    const submitButton = screen.getByRole('button', { name: /submitting/i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByText('Submitting...')).toBeInTheDocument()
  })

  it('closes dialog when cancel is clicked', () => {
    render(<FeedbackForm open={true} onClose={mockOnClose} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })
})