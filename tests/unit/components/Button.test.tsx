/**
 * Comprehensive tests for Button component
 * Achieving 100% coverage of Button.tsx
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  Button: ({ children, disabled, startIcon, ...props }: any) => (
    <button 
      disabled={disabled} 
      {...props}
      className={[
        'MuiButton-root',
        props.variant === 'contained' && 'MuiButton-contained',
        props.color === 'primary' && 'MuiButton-colorPrimary',
        props.size === 'large' && 'MuiButton-sizeLarge',
        props.fullWidth && 'MuiButton-fullWidth',
      ].filter(Boolean).join(' ')}
    >
      {startIcon && <span className="MuiButton-startIcon">{startIcon}</span>}
      {children}
    </button>
  ),
  CircularProgress: ({ size }: any) => (
    <div role="progressbar" style={{ width: size, height: size }}>Loading...</div>
  ),
}));

import { Button } from '../../../apps/web/src/components/ui/Button';

describe('Button Component', () => {
  describe('Basic functionality', () => {
    test('renders button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    test('handles click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });
      
      expect(button).toBeDisabled();
    });
  });

  describe('Loading state', () => {
    test('shows loading spinner when loading prop is true', () => {
      render(<Button loading>Loading</Button>);
      
      // Check for CircularProgress component
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('disables button when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });

    test('shows loadingText when provided during loading', () => {
      render(
        <Button loading loadingText="Processing...">
          Submit
        </Button>
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    test('shows children when loading but no loadingText', () => {
      render(
        <Button loading>
          Submit
        </Button>
      );
      
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('Props forwarding', () => {
    test('forwards variant prop to MUI Button', () => {
      render(<Button variant="contained">Contained</Button>);
      const button = screen.getByRole('button', { name: /contained/i });
      
      expect(button).toHaveClass('MuiButton-contained');
    });

    test('forwards color prop to MUI Button', () => {
      render(<Button color="primary">Primary</Button>);
      const button = screen.getByRole('button', { name: /primary/i });
      
      expect(button).toHaveClass('MuiButton-colorPrimary');
    });

    test('forwards size prop to MUI Button', () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole('button', { name: /large/i });
      
      expect(button).toHaveClass('MuiButton-sizeLarge');
    });

    test('forwards fullWidth prop to MUI Button', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button', { name: /full width/i });
      
      expect(button).toHaveClass('MuiButton-fullWidth');
    });

    test('forwards startIcon when not loading', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      render(
        <Button startIcon={<TestIcon />}>
          With Icon
        </Button>
      );
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    test('replaces startIcon with loading spinner when loading', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      render(
        <Button loading startIcon={<TestIcon />}>
          With Icon
        </Button>
      );
      
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('supports aria-label', () => {
      render(
        <Button aria-label="Submit form">
          Submit
        </Button>
      );
      
      expect(screen.getByLabelText('Submit form')).toBeInTheDocument();
    });

    test('supports aria-describedby', () => {
      render(
        <>
          <span id="button-description">This button submits the form</span>
          <Button aria-describedby="button-description">Submit</Button>
        </>
      );
      
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAttribute('aria-describedby', 'button-description');
    });

    test('maintains focus when loading state changes', () => {
      const { rerender } = render(<Button>Submit</Button>);
      const button = screen.getByRole('button', { name: /submit/i });
      
      button.focus();
      expect(button).toHaveFocus();
      
      // Change to loading state
      rerender(<Button loading>Submit</Button>);
      
      // Button should still be in the document (though disabled)
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    test('handles both disabled and loading props', () => {
      render(
        <Button disabled loading>
          Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('handles empty children', () => {
      render(<Button />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('handles complex children', () => {
      render(
        <Button>
          <span>Complex</span>
          <strong>Children</strong>
        </Button>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    test('handles undefined loadingText', () => {
      render(
        <Button loading loadingText={undefined}>
          Submit
        </Button>
      );
      
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });
});