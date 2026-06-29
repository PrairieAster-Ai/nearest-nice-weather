/**
 * Type contracts for the user-feedback feature: the form payload, the API
 * response, the persisted database row, and the Zod schema that validates
 * incoming submissions. Shared by the feedback form, the submission hook, and
 * the feedback API handler so client and server agree on the shape.
 */
import { z } from 'zod'

/** User-submitted feedback as captured by the feedback form. */
export interface FeedbackFormData {
  /** Star rating from 1 (worst) to 5 (best). */
  rating: number
  /** Free-text feedback body. */
  comment: string
  /** Optional reply-to email address. */
  email?: string
  /** What kind of feedback this is. */
  category: 'bug' | 'feature' | 'general'
}

/** API response returned after a feedback submission succeeds. */
export interface FeedbackSubmissionResponse {
  /** Whether the submission was accepted. */
  success: boolean
  /** Human-readable status message. */
  message: string
  /** Database id assigned to the new feedback record. */
  id: number
}

/**
 * Persisted feedback row as stored in the database — the form fields plus
 * server-captured request metadata and timestamps.
 */
export interface FeedbackRecord {
  /** Database primary key. */
  id: number
  /** Star rating from 1 to 5. */
  rating: number
  /** Free-text feedback body. */
  comment: string
  /** Optional reply-to email address. */
  email?: string
  /** What kind of feedback this is. */
  category: 'bug' | 'feature' | 'general'
  /** Browser user-agent captured server-side at submission time. */
  user_agent?: string
  /** Client IP address captured server-side at submission time. */
  ip_address?: string
  /** ISO-8601 creation timestamp. */
  created_at: string
  /** ISO-8601 last-update timestamp. */
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
