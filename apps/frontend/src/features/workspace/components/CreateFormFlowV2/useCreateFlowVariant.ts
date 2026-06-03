import { useFeatureValue } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

const DEV_OVERRIDE_KEY = 'dev_create_flow_variant'

/**
 * Reads the create-flow-variant feature flag with localStorage override
 * support for local development (GrowthBook DevTools doesn't reliably
 * override string flags).
 *
 * To override locally, run in browser console:
 *   localStorage.setItem('dev_create_flow_variant', 'a')  // or 'b', 'c', 'off'
 *   localStorage.removeItem('dev_create_flow_variant')     // revert to GrowthBook
 */
export const useCreateFlowVariant = (): string | null => {
  const growthbookValue = useFeatureValue(
    featureFlags.createFlowVariant as string,
    'off',
  )

  if (import.meta.env.MODE === 'development') {
    const override = localStorage.getItem(DEV_OVERRIDE_KEY)
    if (override !== null) return override
  }

  return growthbookValue
}
