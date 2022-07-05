import { compareDesc, isAfter } from 'date-fns'

import { UserDto } from '~shared/types/user'

import { FEATURE_UPDATE_LIST } from '../FeatureUpdateList'

export const getShowLatestFeatureUpdateNotification = (
  user: UserDto | undefined,
): boolean => {
  if (!user?.flags?.lastSeenFeatureUpdateDate) {
    return true
  }

  const latestFeatureUpdate = FEATURE_UPDATE_LIST.sort((a, b) =>
    compareDesc(a.date, b.date),
  ).shift()

  if (!latestFeatureUpdate) {
    return false
  }

  return isAfter(latestFeatureUpdate.date, user.flags.lastSeenFeatureUpdateDate)
}
