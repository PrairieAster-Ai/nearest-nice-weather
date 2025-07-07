import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/test-utils'
import { Button } from '../Button'

describe.skip('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Button loading loadingText="Processing...">Submit</Button>)
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn()
    render(<Button loading onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom variant', () => {
    render(<Button variant="outlined">Outlined Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('MuiButton-outlined')
  })
})