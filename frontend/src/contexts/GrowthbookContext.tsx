import { ReactNode } from 'react'
import { GrowthBookProvider as BaseGrowthBookProvider } from '@growthbook/growthbook-react'

import { createGrowthbookInstance } from '~/growthbook'

import { useEnv } from '~features/env/queries'

/**
 * Provider component that wraps your app and makes auth object available to any
 * child component that calls `useAuth()`.
 */
export const GrowthBookProvider = ({ children }: { children: ReactNode }) => {
  const { data: { growthbookClientKey } = {} } = useEnv()

  return (
    <BaseGrowthBookProvider
      growthbook={
        growthbookClientKey
          ? createGrowthbookInstance(growthbookClientKey)
          : undefined
      }
    >
      {children}
    </BaseGrowthBookProvider>
  )
}
