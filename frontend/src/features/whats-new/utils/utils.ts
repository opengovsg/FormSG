import { isAfter } from 'date-fns'

import { UserDto } from '~shared/types/user'

import { FeatureUpdateList } from '../FeatureUpdateList'

export const getShowLatestFeatureUpdateNotification = (
  user: UserDto | undefined,
): boolean => {
  if (user?.flags?.lastSeenFeatureUpdateDate) {
    const sortedFeatureUpdateList = FeatureUpdateList.sort(
      (featureUpdateA, featureUpdateB) =>
        Date.parse(featureUpdateB.date) - Date.parse(featureUpdateA.date),
    )
    const lastSeenUserFeatureUpdateDate = new Date(
      user?.flags?.lastSeenFeatureUpdateDate,
    )

    const latestFeatureUpdateDate = new Date(sortedFeatureUpdateList[0].date)

    return isAfter(latestFeatureUpdateDate, lastSeenUserFeatureUpdateDate)
  }

  return true
}
