import { ApiService } from './ApiService'

export const getFeatureFlagEnabled = async (flag: string): Promise<boolean> => {
  return ApiService.get<boolean>('/feature-flags/enabled', {
    params: { flag },
  }).then(({ data }) => data)
}
