import { useState } from 'react'
import { 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Button,
  Rating,
  Typography,
  Box,
  Alert,
  Slide,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import { Feedback as FeedbackIcon } from '@mui/icons-material'
import { TransitionProps } from '@mui/material/transitions'
import React from 'react'

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export function FeedbackFab() {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(0)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating || !comment.trim()) return

    setSubmitting(true)
    setMessage('')

    try {
      // Use proxy in all environments
      const apiUrl = '/api/feedback'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: comment,
          rating,
          email: email || undefined,
          categories,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Thank you for your feedback! We appreciate your input.')
        setMessageType('success')
        setRating(0)
        setComment('')
        setEmail('')
        setCategories([])
        setTimeout(() => {
          setOpen(false)
          setMessage('')
        }, 2000)
      } else {
        setMessage(data.error || 'Failed to submit feedback')
        setMessageType('error')
      }
    } catch {
      setMessage('Failed to submit feedback. Please try again.')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setMessage('')
  }

  return (
    <>
      <Fab
        color="secondary"
        aria-label="feedback"
        onClick={() => setOpen(true)}
        sx={{
          backgroundColor: '#7563A8',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            backgroundColor: '#6B5B95',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <FeedbackIcon />
      </Fab>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
        keepMounted
      >
        <DialogTitle>
          <Box className="flex items-center space-x-2">
            <span className="text-xl">💬</span>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Share Your Feedback</div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                Help us improve your weather searching experience
              </div>
            </div>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-6">
            {/* Rating */}
            <Box>
              <Typography component="legend" gutterBottom>
                How would you rate your experience? *
              </Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
                size="large"
                precision={1}
              />
            </Box>

            {/* Category Emoji Buttons */}
            <Box>
              <ToggleButtonGroup
                value={categories}
                onChange={(_, newCategories) => setCategories(newCategories)}
                aria-label="feedback categories"
                size="large"
                sx={{
                  display: 'flex',
                  gap: 2,
                  '& .MuiToggleButton-root': {
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1.5rem',
                    minWidth: '80px',
                    height: '80px',
                    flexDirection: 'column',
                    '&.Mui-selected': {
                      backgroundColor: '#7563A8',
                      color: 'white',
                      borderColor: '#7563A8',
                      '&:hover': {
                        backgroundColor: '#6B5B95',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  },
                }}
              >
                <ToggleButton value="general" aria-label="general feedback">
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontSize: '1.5rem' }}>💬</span>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                      General
                    </Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="bug" aria-label="bug report">
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontSize: '1.5rem' }}>🪲</span>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                      Bug
                    </Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="feature" aria-label="feature request">
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontSize: '1.5rem' }}>💡</span>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                      Feature
                    </Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="performance" aria-label="performance">
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontSize: '1.5rem' }}>🏁</span>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                      Speed
                    </Typography>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Comment */}
            <TextField
              label="Your feedback"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
              required
              helperText={`${comment.length}/1000 characters`}
              inputProps={{ maxLength: 1000 }}
            />

            {/* Email */}
            <TextField
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              helperText="We'll only use this to follow up on your feedback"
            />

            {/* Message */}
            {message && (
              <Alert severity={messageType} className="mt-4">
                {message}
              </Alert>
            )}
          </DialogContent>

          <DialogActions className="px-6 pb-6">
            <Button onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !rating || !comment.trim()}
              sx={{
                backgroundColor: '#7563A8',
                '&:hover': {
                  backgroundColor: '#6B5B95',
                },
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}