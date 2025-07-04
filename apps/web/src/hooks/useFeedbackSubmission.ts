import { useMutation, useQueryClient } from '@tanstack/react-query'
import { weatherApi } from '../services/weatherApi'
import { monitoring } from '../services/monitoring'
import type { FeedbackFormData, FeedbackSubmissionResponse } from '../types/feedback'

interface UseFeedbackSubmissionOptions {
  onSuccess?: (data: FeedbackSubmissionResponse) => void
  onError?: (error: Error) => void
}

export const useFeedbackSubmission = (options?: UseFeedbackSubmissionOptions) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (feedback: FeedbackFormData): Promise<FeedbackSubmissionResponse> => {
      const startTime = Date.now()
      
      try {
        // Track the feedback submission attempt
        monitoring.captureUserAction('feedback_submission_started', {
          category: feedback.category,
          rating: feedback.rating,
          hasEmail: !!feedback.email,
        })

        // Submit feedback to API
        const response = await weatherApi.submitFeedback(feedback)
        
        // Track successful submission
        monitoring.captureUserAction('feedback_submission_completed', {
          category: feedback.category,
          rating: feedback.rating,
          duration: Date.now() - startTime,
        })

        return response
      } catch (error) {
        // Track failed submission
        monitoring.captureError(error as Error, {
          context: 'feedback_submission',
          category: feedback.category,
          rating: feedback.rating,
          duration: Date.now() - startTime,
        })
        
        throw error
      }
    },
    onSuccess: (data) => {
      // Invalidate any feedback-related queries if they exist
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
      
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      monitoring.captureError(error as Error, {
        context: 'feedback_submission_handler',
      })
      
      options?.onError?.(error as Error)
    },
    retry: (failureCount, error) => {
      // Don't retry on client errors (400-499)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status
        if (status >= 400 && status < 500) {
          return false
        }
      }
      
      // Retry up to 2 times for server errors
      return failureCount < 2
    },
  })
}