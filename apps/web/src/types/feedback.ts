import { z } from 'zod'

/** User-submitted feedback as captured by the feedback form. */
export interface FeedbackFormData {
  rating: number
  comment: string
  email?: string
  category: 'bug' | 'feature' | 'general'
}

/** API response returned after a feedback submission succeeds. */
export interface FeedbackSubmissionResponse {
  success: boolean
  message: string
  id: number
}

/**
 * Persisted feedback row as stored in the database — the form fields plus
 * server-captured request metadata and timestamps.
 */
export interface FeedbackRecord {
  id: number
  rating: number
  comment: string
  email?: string
  category: 'bug' | 'feature' | 'general'
  user_agent?: string
  ip_address?: string
  created_at: string
  updated_at: string
}

/**
 * Runtime validation schema for incoming feedback: rating 1–5, non-empty
 * comment (≤1000 chars), optional email, and a known category.
 */
export const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
  email: z.email().optional().or(z.literal('')),
  category: z.enum(['bug', 'feature', 'general']),
})

/** Feedback payload validated against {@link FeedbackSchema}. */
export type ValidatedFeedback = z.infer<typeof FeedbackSchema>
