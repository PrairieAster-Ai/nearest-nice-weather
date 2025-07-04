import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Typography,
  Box,
  Snackbar,
  Alert,
  FormHelperText,
} from '@mui/material'
import { Button } from '../ui/Button'
import { useFeedbackSubmission } from '../../hooks/useFeedbackSubmission'
import { UserInputSchemas } from '../../utils/validation'
import type { FeedbackFormData } from '../../types/feedback'

interface FeedbackFormProps {
  open: boolean
  onClose: () => void
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ open, onClose }) => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    rating: 0,
    comment: '',
    email: undefined,
    category: 'general',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const { mutate: submitFeedback, isPending } = useFeedbackSubmission({
    onSuccess: () => {
      setShowSuccess(true)
      setFormData({ rating: 0, comment: '', email: undefined, category: 'general' })
      setErrors({})
      onClose()
    },
    onError: (error: any) => {
      setErrors({ submit: error.message || 'Failed to submit feedback' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      // Validate form data
      const validatedData = UserInputSchemas.feedback.parse(formData)
      submitFeedback(validatedData)
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ submit: 'Please check your input and try again' })
      }
    }
  }

  const handleChange = (field: keyof FeedbackFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleClose = () => {
    setFormData({ rating: 0, comment: '', email: undefined, category: 'general' })
    setErrors({})
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Share Your Feedback</Typography>
          <Typography variant="body2" color="text.secondary">
            Help us improve your weather searching experience
          </Typography>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Rating */}
              <Box>
                <Typography component="legend" gutterBottom>
                  How would you rate your experience? *
                </Typography>
                <Rating
                  value={formData.rating}
                  onChange={(_, newValue) => handleChange('rating', newValue || 0)}
                  size="large"
                />
                {errors.rating && (
                  <FormHelperText error>{errors.rating}</FormHelperText>
                )}
              </Box>

              {/* Category */}
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Feedback Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  label="Feedback Category"
                >
                  <MenuItem value="general">General Feedback</MenuItem>
                  <MenuItem value="bug">Bug Report</MenuItem>
                  <MenuItem value="feature">Feature Request</MenuItem>
                </Select>
                {errors.category && (
                  <FormHelperText>{errors.category}</FormHelperText>
                )}
              </FormControl>

              {/* Comment */}
              <TextField
                label="Your feedback"
                multiline
                rows={4}
                value={formData.comment}
                onChange={(e) => handleChange('comment', e.target.value)}
                error={!!errors.comment}
                helperText={errors.comment || `${formData.comment.length}/1000 characters`}
                fullWidth
                required
              />

              {/* Email (optional) */}
              <TextField
                label="Email (optional)"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email || 'We\'ll only use this to follow up on your feedback'}
                fullWidth
              />

              {errors.submit && (
                <Alert severity="error">{errors.submit}</Alert>
              )}
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              loading={isPending}
              loadingText="Submitting..."
              disabled={formData.rating === 0 || !formData.comment.trim()}
            >
              Submit Feedback
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Thank you for your feedback! We appreciate your input.
        </Alert>
      </Snackbar>
    </>
  )
}