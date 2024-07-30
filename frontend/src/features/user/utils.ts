import { SeenFlags, UserDto } from '~shared/types'

import { SeenFlagsMapVersion } from './constants'

/**
 * Returns whether the user should see the feature flag.
 * @param user The user to check.
 * @param flag The flag to check.
 * @returns Boolean indicating whether the user should see the flag.
 */

export const getShowFeatureFlagLastSeen = (
  user: UserDto | undefined,
  flag: SeenFlags,
): boolean => {
  const since = SeenFlagsMapVersion[flag]
  const flagValue = user?.flags?.[flag]
  if (flagValue == null) {
    // If the flag is not set, failover as user has seen the flag.
    return true
  }

  return flagValue < since
}
