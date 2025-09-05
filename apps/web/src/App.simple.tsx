import { useState } from 'react'

function App() {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(0)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback,
          rating,
          email: email || undefined,
          category: 'general',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('✅ Thank you for your feedback!')
        setFeedback('')
        setRating(0)
        setEmail('')
        setTimeout(() => setFeedbackOpen(false), 2000)
      } else {
        setMessage('❌ ' + (data.error || 'Failed to submit feedback'))
      }
    } catch {
      setMessage('❌ Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">
            🌤️ Nearest Nice Weather
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Weather Intelligence Platform</h2>
            <p className="text-gray-600 mb-4">
              Find the nearest locations with your perfect weather conditions.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800">Platform Status</h3>
              <p className="text-sm text-blue-600">✅ Ready for Development</p>
              <p className="text-xs text-gray-500 mt-2">
                Infrastructure validated • Database connected • API endpoints ready
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/api/docs" target="_blank"
                 className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 text-center block">
                📖 API Documentation
              </a>
              <a href="/api/health" target="_blank"
                 className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 text-center block">
                🏥 API Health Check
              </a>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 text-center block">
                💬 Share Feedback
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-gray-600">
            <p>🚀 Weather Intelligence Platform</p>
            <p className="text-sm">MVP Ready for Feature Development</p>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Share Your Feedback</h3>
              <button
                onClick={() => setFeedbackOpen(false)}
                className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={submitFeedback}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your feedback *
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Tell us what you think..."
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !feedback.trim() || rating === 0}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300">
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
