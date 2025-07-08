import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWeatherSearch } from '../useWeatherSearch'

describe.skip('useWeatherSearch Hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useWeatherSearch())
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.results).toEqual([])
  })

})