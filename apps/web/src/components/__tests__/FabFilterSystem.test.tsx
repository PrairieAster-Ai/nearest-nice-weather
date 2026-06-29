/**
 * ========================================================================
 * FabFilterSystem COMPONENT TESTS
 * ========================================================================
 *
 * Exercises the weather-preference FAB cluster: rendering one FAB per axis,
 * showing the selected glyph vs the category glyph, opening/closing the
 * slide-out options, firing onFilterChange on selection, the loading spinner
 * state, and accessibility attributes.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FabFilterSystem } from '../FabFilterSystem'

const baseFilters = { temperature: 'mild', precipitation: 'none', wind: 'calm' }

describe('FabFilterSystem', () => {
  it('renders a FAB for each weather axis', () => {
    render(<FabFilterSystem filters={baseFilters} onFilterChange={vi.fn()} />)
    expect(screen.getByTestId('filter-temperature')).toBeInTheDocument()
    expect(screen.getByTestId('filter-precipitation')).toBeInTheDocument()
    expect(screen.getByTestId('filter-wind')).toBeInTheDocument()
  })

  it('labels each FAB with its current selection for screen readers', () => {
    render(<FabFilterSystem filters={baseFilters} onFilterChange={vi.fn()} />)
    expect(screen.getByTestId('filter-temperature')).toHaveAttribute(
      'aria-label',
      'Temperature filter: Mild',
    )
    expect(screen.getByTestId('filter-precipitation')).toHaveAttribute(
      'aria-label',
      'Precipitation filter: None',
    )
  })

  it('shows the category glyph when an axis has no selection', () => {
    render(
      <FabFilterSystem
        filters={{ temperature: '', precipitation: 'none', wind: 'calm' }}
        onFilterChange={vi.fn()}
      />,
    )
    // Unselected temperature falls back to the thermometer category glyph,
    // and the aria-label reports "All".
    expect(screen.getByTestId('filter-temperature')).toHaveAttribute(
      'aria-label',
      'Temperature filter: All',
    )
    expect(within(screen.getByTestId('filter-temperature')).getByText('🌡️')).toBeInTheDocument()
  })

  it('opens the slide-out options when a category FAB is clicked', async () => {
    const user = userEvent.setup()
    render(<FabFilterSystem filters={baseFilters} onFilterChange={vi.fn()} />)

    const tempFab = screen.getByTestId('filter-temperature')
    expect(tempFab).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('temperature-cold')).not.toBeInTheDocument()

    await user.click(tempFab)

    expect(tempFab).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('temperature-cold')).toBeInTheDocument()
    expect(screen.getByTestId('temperature-mild')).toBeInTheDocument()
    expect(screen.getByTestId('temperature-hot')).toBeInTheDocument()
  })

  it('marks the currently selected option as pressed', async () => {
    const user = userEvent.setup()
    render(<FabFilterSystem filters={baseFilters} onFilterChange={vi.fn()} />)

    await user.click(screen.getByTestId('filter-temperature'))
    expect(screen.getByTestId('temperature-mild')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('temperature-cold')).toHaveAttribute('aria-pressed', 'false')
  })

  it('fires onFilterChange and closes the flyout when an option is chosen', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()
    render(<FabFilterSystem filters={baseFilters} onFilterChange={onFilterChange} />)

    await user.click(screen.getByTestId('filter-wind'))
    await user.click(screen.getByTestId('wind-windy'))

    expect(onFilterChange).toHaveBeenCalledWith('wind', 'windy')
    expect(screen.getByTestId('filter-wind')).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles a category closed when its FAB is clicked twice', async () => {
    const user = userEvent.setup()
    render(<FabFilterSystem filters={baseFilters} onFilterChange={vi.fn()} />)

    const precipFab = screen.getByTestId('filter-precipitation')
    await user.click(precipFab)
    expect(precipFab).toHaveAttribute('aria-expanded', 'true')

    await user.click(precipFab)
    expect(precipFab).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows a loading spinner instead of the glyph while filtering', () => {
    render(<FabFilterSystem filters={baseFilters} onFilterChange={vi.fn()} isLoading />)
    // CircularProgress renders a progressbar role.
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
  })
})
