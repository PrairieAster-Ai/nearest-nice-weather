import { z } from 'zod'

// Feedback form data types
export interface FeedbackFormData {
  rating: number
  comment: string
  email?: string
  category: 'bug' | 'feature' | 'general'
}

// API response types
export interface FeedbackSubmissionResponse {
  success: boolean
  message: string
  id: number
}

// Database model types
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

// Zod validation schemas
export const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
  email: z.string().email().optional().or(z.literal('')),
  category: z.enum(['bug', 'feature', 'general']),
})

export type ValidatedFeedback = z.infer<typeof FeedbackSchema>