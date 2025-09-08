// AdManager Hook
// Custom hook for accessing AdManager functionality

import { useContext } from 'react';
import { AdManagerContext, type AdManagerContextType } from '../components/ads/AdManagerContext';

/**
 * Hook to access AdManager functionality
 */
export const useAdManager = (): AdManagerContextType => {
  const context = useContext(AdManagerContext);
  if (!context) {
    throw new Error('useAdManager must be used within AdManagerProvider');
  }
  return context;
};
