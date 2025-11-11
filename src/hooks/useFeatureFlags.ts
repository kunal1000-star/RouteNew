// useFeatureFlags Hook
// ===================
// Custom hook for feature flag management

'use client';

import { useContext } from 'react';
import { FeatureFlagContext, type FeatureFlagContextType } from '@/contexts/FeatureFlagContext';

export function useFeatureFlags(): FeatureFlagContextType {
  const featureFlagContext = useContext(FeatureFlagContext);
  
  if (featureFlagContext === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  
  return featureFlagContext;
}

export default useFeatureFlags;