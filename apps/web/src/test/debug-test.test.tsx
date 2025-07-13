import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Simple test component using JSX with React 18 LTS
const TestComponent = () => {
  return <div>Hello Test</div>
}

describe('Debug Test', () => {
  it('should render simple component', () => {
    render(<TestComponent />)
    expect(screen.getByText('Hello Test')).toBeInTheDocument()
  })
})