import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#7563A8',
    },
  },
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)
import { WeatherFilters } from '../WeatherFilters'
import type { WeatherFilter } from '../../../types/weather'

describe('WeatherFilters Component', () => {
  const defaultFilters: WeatherFilter = {
    temperature: 'mild',
    precipitation: 'none',
    wind: 'calm'
  }

  it('renders all filter options', () => {
    const onChange = vi.fn()
    render(<WeatherFilters filters={defaultFilters} onChange={onChange} />, { wrapper: TestWrapper })
    
    expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/precipitation/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/wind/i)).toBeInTheDocument()
  })

  it('displays current filter values', () => {
    const onChange = vi.fn()
    render(<WeatherFilters filters={defaultFilters} onChange={onChange} />, { wrapper: TestWrapper })
    
    expect(screen.getByDisplayValue('mild')).toBeInTheDocument()
    expect(screen.getByDisplayValue('none')).toBeInTheDocument()
    expect(screen.getByDisplayValue('calm')).toBeInTheDocument()
  })

  it('calls onChange when filter is changed', () => {
    const onChange = vi.fn()
    render(<WeatherFilters filters={defaultFilters} onChange={onChange} />, { wrapper: TestWrapper })
    
    const temperatureSelect = screen.getByLabelText(/temperature/i)
    fireEvent.change(temperatureSelect, { target: { value: 'warm' } })
    
    expect(onChange).toHaveBeenCalledWith('temperature', 'warm')
  })

  it('disables filters when disabled prop is true', () => {
    const onChange = vi.fn()
    render(<WeatherFilters filters={defaultFilters} onChange={onChange} disabled />, { wrapper: TestWrapper })
    
    expect(screen.getByLabelText(/temperature/i)).toBeDisabled()
    expect(screen.getByLabelText(/precipitation/i)).toBeDisabled()
    expect(screen.getByLabelText(/wind/i)).toBeDisabled()
  })
})