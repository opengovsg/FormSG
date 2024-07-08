import { ApiService } from '../../services/ApiService'

export const getEnabledFeatureFlags = async (): Promise<Set<string>> => {
  return ApiService.get<string[]>('/feature-flags/enabled').then(
    ({ data }) => new Set(data),
  )
}
