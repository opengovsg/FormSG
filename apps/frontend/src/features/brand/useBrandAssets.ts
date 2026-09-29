import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { BrandAssets, selectBrandAssets } from './selectBrandAssets'

/** Thin wrapper: reads the brand-refresh flag, hands off to selectBrandAssets. */
export const useBrandAssets = (): BrandAssets => {
  const isOn = useFeatureIsOn(featureFlags.brandRefresh)
  return selectBrandAssets(isOn)
}
