import { ApiService } from '~services/ApiService'

export const getStatusTrackerData = async (
  submissionId: string,
): Promise<string> => {
  console.log('FE is calling the api service!')
  return ApiService.get<string>(`/status/${submissionId}`).then(
    ({ data }) => data,
  )
}
