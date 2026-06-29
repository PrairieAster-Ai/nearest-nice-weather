/**
 * ========================================================================
 * AdUnit COMPONENT TESTS
 * ========================================================================
 *
 * Covers the three render branches: the development test-mode placeholder
 * (with/without label, per-placement sizing), the "no client configured"
 * null render, and the real AdSense render path when a client id is present.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdUnit } from '../AdUnit'

describe('AdUnit', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('test-mode placeholder', () => {
    it('renders a labelled test placeholder for the given placement', () => {
      render(<AdUnit slot="123" placement="weather-results" testMode />)
      expect(screen.getByText(/Advertisement \(Test Mode\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Test Ad Unit - weather-results/i)).toBeInTheDocument()
    })

    it('hides the label when showLabel is false', () => {
      render(<AdUnit slot="123" placement="sidebar" testMode showLabel={false} />)
      expect(screen.queryByText(/Advertisement \(Test Mode\)/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Test Ad Unit - sidebar/i)).toBeInTheDocument()
    })

    it('shows the configured client id in the placeholder', () => {
      render(<AdUnit slot="123" placement="homepage-banner" testMode />)
      expect(screen.getByText(/Production: ca-pub-test/i)).toBeInTheDocument()
    })
  })

  describe('no client configured', () => {
    it('renders nothing when not in test mode and no real client id is set', () => {
      const { container } = render(
        <AdUnit slot="123" placement="weather-results" testMode={false} />,
      )
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('real AdSense render path', () => {
    it('renders the AdSense unit and label when a real client id is configured', () => {
      vi.stubEnv('REACT_APP_ADSENSE_CLIENT_ID', 'ca-pub-9999999999')
      // Provide the queue the AdSense component pushes to on mount.
      ;(window as any).adsbygoogle = []

      const { container } = render(
        <AdUnit slot="555" placement="weather-results" testMode={false} />,
      )

      expect(screen.getByText(/^Advertisement$/)).toBeInTheDocument()
      // @ctrl/react-adsense renders an <ins class="adsbygoogle"> element.
      expect(container.querySelector('ins.adsbygoogle')).not.toBeNull()
    })
  })
})
