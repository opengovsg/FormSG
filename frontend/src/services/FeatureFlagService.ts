import { ApiService } from './ApiService'

export const getFeatureFlagsEnabled = async (): Promise<Set<string>> => {
  return ApiService.get<string[]>('/feature-flags/enabled').then(
    ({ data }) => new Set(data),
  )
}
