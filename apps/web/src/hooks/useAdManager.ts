// AdManager Hook
// Custom hook for accessing AdManager functionality

import { useContext } from 'react';
import { AdManagerContext, type AdManagerContextType } from '../components/ads/AdManagerContext';

/**
 * Reads the {@link AdManagerContextType} from the nearest `AdManagerProvider`:
 * ad-block detection, load state, A/B test group, and performance metrics.
 *
 * @returns The AdManager context value.
 * @throws Error if called outside an `AdManagerProvider`.
 * @example
 * ```tsx
 * const { isAdBlockDetected, testGroup } = useAdManager();
 * ```
 */
export const useAdManager = (): AdManagerContextType => {
  const context = useContext(AdManagerContext);
  if (!context) {
    throw new Error('useAdManager must be used within AdManagerProvider');
  }
  return context;
};
