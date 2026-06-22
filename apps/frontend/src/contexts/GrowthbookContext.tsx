import { ReactNode, useEffect, useMemo } from 'react'
import {
  GrowthBook,
  GrowthBookProvider as BaseGrowthBookProvider,
} from '@growthbook/growthbook-react'

import { UserDto } from 'formsg-shared/types/user'

import { createGrowthbookInstance } from '~/growthbook'

import { useEnv } from '~features/env/queries'
import { useUser } from '~features/user/queries'

const injectGrowthBookAttributes = (
  growthbook: GrowthBook | undefined,
  user: UserDto | undefined,
) => {
  if (!growthbook) return

  const currentAttributes = growthbook.getAttributes()

  // RATIONALE: Only update when values change — setAttributes publishes to all subscribers.
  const hasChanges =
    currentAttributes.adminEmail !== user?.email ||
    currentAttributes.adminAgency !== user?.agency?.shortName

  if (hasChanges) {
    growthbook.setAttributes({
      ...currentAttributes,
      adminEmail: user?.email,
      adminAgency: user?.agency?.shortName,
    })
  }
}

export const GrowthBookProvider = ({ children }: { children: ReactNode }) => {
  const { data: { growthbookClientKey } = {} } = useEnv()
  const { user } = useUser()

  const growthbook = useMemo(
    () =>
      growthbookClientKey
        ? createGrowthbookInstance(growthbookClientKey)
        : undefined,
    [growthbookClientKey],
  )

  useEffect(() => {
    if (growthbook && user) {
      injectGrowthBookAttributes(growthbook, user)
    }
    // RATIONALE: do not use 'user' in the dependency array as its reference can change.
  }, [growthbook, user?.email, user?.agency?.shortName])

  return (
    <BaseGrowthBookProvider growthbook={growthbook}>
      {children}
    </BaseGrowthBookProvider>
  )
}
