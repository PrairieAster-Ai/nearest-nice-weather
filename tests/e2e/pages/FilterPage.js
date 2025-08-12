/**
 * ========================================================================
 * FILTER PAGE OBJECT MODEL
 * ========================================================================
 * 
 * @PURPOSE: Encapsulates weather filter interactions using semantic locators
 * @FOLLOWS: Playwright best practices for user-facing element selection
 * 
 * ========================================================================
 */

import { expect } from '@playwright/test'

export class FilterPage {
  constructor(page) {
    this.page = page
    
    // USER-FACING LOCATORS using new test IDs and ARIA labels
    this.temperatureFilter = page.getByTestId('filter-temperature')
    this.precipitationFilter = page.getByTestId('filter-precipitation')  
    this.windFilter = page.getByTestId('filter-wind')
    
    // TEMPERATURE OPTIONS
    this.temperatureCold = page.getByTestId('temperature-cold')
    this.temperatureMild = page.getByTestId('temperature-mild')
    this.temperatureHot = page.getByTestId('temperature-hot')
    
    // PRECIPITATION OPTIONS
    this.precipitationNone = page.getByTestId('precipitation-none')
    this.precipitationLight = page.getByTestId('precipitation-light')
    this.precipitationHeavy = page.getByTestId('precipitation-heavy')
    
    // WIND OPTIONS  
    this.windCalm = page.getByTestId('wind-calm')
    this.windBreezy = page.getByTestId('wind-breezy')
    this.windWindy = page.getByTestId('wind-windy')
    
    // LOADING STATES
    this.loadingIndicator = page.getByTestId('filters-loading')
  }

  // FILTER INTERACTION METHODS
  async selectTemperature(preference = 'mild') {
    await this.temperatureFilter.click() // Open options
    
    const optionMap = {
      'cold': this.temperatureCold,
      'mild': this.temperatureMild,
      'hot': this.temperatureHot
    }
    
    const option = optionMap[preference]
    if (!option) throw new Error(`Invalid temperature preference: ${preference}`)
    
    await option.click()
    await this.waitForFilterUpdate()
    
    return this
  }

  async selectPrecipitation(preference = 'none') {
    await this.precipitationFilter.click()
    
    const optionMap = {
      'none': this.precipitationNone,
      'light': this.precipitationLight, 
      'heavy': this.precipitationHeavy
    }
    
    const option = optionMap[preference]
    if (!option) throw new Error(`Invalid precipitation preference: ${preference}`)
    
    await option.click()
    await this.waitForFilterUpdate()
    
    return this
  }

  async selectWind(preference = 'calm') {
    await this.windFilter.click()
    
    const optionMap = {
      'calm': this.windCalm,
      'breezy': this.windBreezy,
      'windy': this.windWindy
    }
    
    const option = optionMap[preference]
    if (!option) throw new Error(`Invalid wind preference: ${preference}`)
    
    await option.click()
    await this.waitForFilterUpdate()
    
    return this
  }

  // WAIT METHODS
  async waitForFilterUpdate() {
    // Wait for loading indicator to appear and disappear (debounced update)
    try {
      await expect(this.loadingIndicator).toBeVisible({ timeout: 1000 })
      await expect(this.loadingIndicator).toBeHidden({ timeout: 5000 })
    } catch {
      // Loading indicator might not appear for very fast updates
      await this.page.waitForTimeout(500) // Brief pause for state to settle
    }
    
    return this
  }

  async waitForFiltersVisible() {
    await expect(this.temperatureFilter).toBeVisible()
    await expect(this.precipitationFilter).toBeVisible()  
    await expect(this.windFilter).toBeVisible()
    
    return this
  }

  // ASSERTION METHODS
  async expectFiltersVisible() {
    await expect(this.temperatureFilter).toBeVisible()
    await expect(this.precipitationFilter).toBeVisible()
    await expect(this.windFilter).toBeVisible()
    
    return this
  }

  async expectTemperatureSelected(preference) {
    const optionMap = {
      'cold': this.temperatureCold,
      'mild': this.temperatureMild,
      'hot': this.temperatureHot
    }
    
    const option = optionMap[preference]
    await expect(option).toHaveAttribute('aria-pressed', 'true')
    
    return this
  }

  async expectPrecipitationSelected(preference) {
    const optionMap = {
      'none': this.precipitationNone,
      'light': this.precipitationLight,
      'heavy': this.precipitationHeavy
    }
    
    const option = optionMap[preference]
    await expect(option).toHaveAttribute('aria-pressed', 'true')
    
    return this
  }

  async expectWindSelected(preference) {
    const optionMap = {
      'calm': this.windCalm,
      'breezy': this.windBreezy,
      'windy': this.windWindy
    }
    
    const option = optionMap[preference]
    await expect(option).toHaveAttribute('aria-pressed', 'true')
    
    return this
  }

  // GET CURRENT STATE METHODS
  async getCurrentTemperature() {
    const preferences = ['cold', 'mild', 'hot']
    const options = [this.temperatureCold, this.temperatureMild, this.temperatureHot]
    
    for (let i = 0; i < preferences.length; i++) {
      const pressed = await options[i].getAttribute('aria-pressed')
      if (pressed === 'true') return preferences[i]
    }
    
    return null
  }

  async getCurrentPrecipitation() {
    const preferences = ['none', 'light', 'heavy']
    const options = [this.precipitationNone, this.precipitationLight, this.precipitationHeavy]
    
    for (let i = 0; i < preferences.length; i++) {
      const pressed = await options[i].getAttribute('aria-pressed')
      if (pressed === 'true') return preferences[i]
    }
    
    return null
  }

  async getCurrentWind() {
    const preferences = ['calm', 'breezy', 'windy']
    const options = [this.windCalm, this.windBreezy, this.windWindy]
    
    for (let i = 0; i < preferences.length; i++) {
      const pressed = await options[i].getAttribute('aria-pressed')
      if (pressed === 'true') return preferences[i]
    }
    
    return null
  }

  async getAllCurrentFilters() {
    return {
      temperature: await this.getCurrentTemperature(),
      precipitation: await this.getCurrentPrecipitation(), 
      wind: await this.getCurrentWind()
    }
  }

  // CONVENIENCE METHODS
  async clearAllFilters() {
    // Click each filter to reset to default
    await this.selectTemperature('mild')
    await this.selectPrecipitation('none')
    await this.selectWind('calm')
    
    return this
  }

  async setWeatherPreferences(preferences = {}) {
    const { temperature = 'mild', precipitation = 'none', wind = 'calm' } = preferences
    
    if (temperature) await this.selectTemperature(temperature)
    if (precipitation) await this.selectPrecipitation(precipitation)  
    if (wind) await this.selectWind(wind)
    
    return this
  }

  // RAPID INTERACTION METHODS (for performance testing)
  async rapidFilterChanges(count = 5) {
    const preferences = {
      temperature: ['cold', 'mild', 'hot'],
      precipitation: ['none', 'light', 'heavy'],
      wind: ['calm', 'breezy', 'windy']
    }
    
    for (let i = 0; i < count; i++) {
      const tempIndex = i % 3
      const precipIndex = (i + 1) % 3
      const windIndex = (i + 2) % 3
      
      await this.selectTemperature(preferences.temperature[tempIndex])
      await this.selectPrecipitation(preferences.precipitation[precipIndex])
      await this.selectWind(preferences.wind[windIndex])
    }
    
    return this
  }

  // MOBILE METHODS
  async tapTemperatureFilter() {
    await this.temperatureFilter.tap()
    return this
  }

  async tapPrecipitationFilter() {
    await this.precipitationFilter.tap()
    return this
  }

  async tapWindFilter() {
    await this.windFilter.tap()
    return this
  }

  // PERFORMANCE METHODS
  async measureFilterResponseTime(filterType = 'temperature') {
    const startTime = Date.now()
    
    switch (filterType) {
      case 'temperature':
        await this.selectTemperature('hot')
        break
      case 'precipitation':
        await this.selectPrecipitation('heavy')
        break
      case 'wind':
        await this.selectWind('windy')
        break
    }
    
    const endTime = Date.now()
    return endTime - startTime
  }

  // VALIDATION METHODS
  async validateFilterState() {
    const state = {
      filtersVisible: false,
      currentFilters: {},
      loadingState: false
    }

    // Check visibility
    state.filtersVisible = await this.temperatureFilter.isVisible() &&
                          await this.precipitationFilter.isVisible() &&
                          await this.windFilter.isVisible()

    // Get current filters
    state.currentFilters = await this.getAllCurrentFilters()
    
    // Check loading state
    state.loadingState = await this.loadingIndicator.isVisible()

    return state
  }
}