import { UserDto } from '~shared/types'

import { FEATURE_UPDATE_LIST } from '../FeatureUpdateList'

export const getShowLatestFeatureUpdateNotification = (
  user: UserDto | undefined,
): boolean => {
  if (user?.flags?.lastSeenFeatureUpdateVersion === undefined) {
    return true
  }

  return user.flags.lastSeenFeatureUpdateVersion < FEATURE_UPDATE_LIST.version
}
