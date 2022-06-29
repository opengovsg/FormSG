import { isAfter } from 'date-fns'

import { UserDto } from '~shared/types/user'

import { FeatureUpdateList } from '../FeatureUpdateList'

export interface shouldShowLatestFeatureUpdateNotificationProps {
  user: UserDto | undefined
  isLoading: boolean
}

export const shouldShowLatestFeatureUpdateNotification = ({
  user,
  isLoading,
}: shouldShowLatestFeatureUpdateNotificationProps): boolean => {
  if (isLoading) {
    return false
  }
  const sortedFeatureUpdateList = FeatureUpdateList.sort(
    (featureUpdateA, featureUpdateB) =>
      Date.parse(featureUpdateB.date) - Date.parse(featureUpdateA.date),
  )
  const lastSeenUserFeatureUpdateDate = new Date(
    user?.flags?.lastSeenFeatureUpdateDate ??
      sortedFeatureUpdateList[sortedFeatureUpdateList.length - 1].date,
  )

  const latestFeatureUpdateDate = new Date(sortedFeatureUpdateList[0].date)

  return isAfter(latestFeatureUpdateDate, lastSeenUserFeatureUpdateDate)
}
