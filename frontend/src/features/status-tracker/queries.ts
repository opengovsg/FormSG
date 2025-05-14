import { useQuery, UseQueryResult } from 'react-query'

import { ApiError } from '~typings/core'

import { getStatusTrackerData } from './StatusTrackerService'

export const useStatusTracker = (
  formId: string,
  submissionId: string,
): UseQueryResult<string, ApiError> => {
  return useQuery(submissionId, () => getStatusTrackerData(submissionId))
}
