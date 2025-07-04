import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/test-utils'
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
    render(<WeatherFilters filters={defaultFilters} onChange={onChange} />)
    
    expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/precipitation/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/wind/i)).toBeInTheDocument()
  })

  it('displays current filter values', () => {
    const onChange = vi.fn()
    render(<WeatherFilters filters={defaultFilters} onChange={onChange} />)
    
    expect(screen.getByDisplayValue('mild')).toBeInTheDocument()
    expect(screen.getByDisplayValue('none')).toBeInTheDocument()
    expect(screen.getByDisplayValue('calm')).toBeInTheDocument()
  })

  it('calls onChange when filter is changed', () => {
    const onChange = vi.fn()
    render(<WeatherFilters filters={defaultFilters} onChange={onChange} />)
    
    const temperatureSelect = screen.getByLabelText(/temperature/i)
    fireEvent.change(temperatureSelect, { target: { value: 'warm' } })
    
    expect(onChange).toHaveBeenCalledWith('temperature', 'warm')
  })

  it('disables filters when disabled prop is true', () => {
    const onChange = vi.fn()
    render(<WeatherFilters filters={defaultFilters} onChange={onChange} disabled />)
    
    expect(screen.getByLabelText(/temperature/i)).toBeDisabled()
    expect(screen.getByLabelText(/precipitation/i)).toBeDisabled()
    expect(screen.getByLabelText(/wind/i)).toBeDisabled()
  })
})