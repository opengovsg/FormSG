import { StatusTrackerData } from 'formsg-shared/types'

import { ApiService } from '~services/ApiService'

export const getStatusTrackerData = async (
  submissionId: string,
): Promise<StatusTrackerData> => {
  return ApiService.get<StatusTrackerData>(`/status/${submissionId}`).then(
    ({ data }) => data,
  )
}
