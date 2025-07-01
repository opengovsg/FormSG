import { useQuery, UseQueryResult } from 'react-query'

import { StatusTrackerData } from '~shared/types'

import { ApiError } from '~typings/core'

import { getStatusTrackerData } from './StatusTrackerService'

export const useStatusTracker = (
  submissionId: string,
): UseQueryResult<StatusTrackerData, ApiError> => {
  return useQuery(submissionId, () => getStatusTrackerData(submissionId))
}
