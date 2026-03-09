import { useQuery, UseQueryResult } from 'react-query'

import { StatusTrackerData } from 'formsg-shared/types'

import { ApiError } from '~typings/core'

import { getStatusTrackerData } from './StatusTrackerService'

export const useStatusTracker = (
  submissionId: string,
): UseQueryResult<StatusTrackerData, ApiError> => {
  return useQuery(submissionId, () => getStatusTrackerData(submissionId))
}
