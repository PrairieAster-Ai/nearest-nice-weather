import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Button } from '../Button'

const theme = createTheme({
  palette: {
    primary: {
      main: '#7563A8',
    },
  },
})

// Simple wrapper for React 19 compatibility
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>, { wrapper: TestWrapper })
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Button loading loadingText="Processing...">Submit</Button>, { wrapper: TestWrapper })
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>, { wrapper: TestWrapper })

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn()
    render(<Button loading onClick={handleClick}>Click me</Button>, { wrapper: TestWrapper })

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom variant', () => {
    render(<Button variant="outlined">Outlined Button</Button>, { wrapper: TestWrapper })
    const button = screen.getByRole('button')
    expect(button).toHaveClass('MuiButton-outlined')
  })
})
