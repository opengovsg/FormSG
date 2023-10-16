import { useQuery, UseQueryResult } from 'react-query'

import { SgidProfilesDto } from '~shared/types/auth'

import { ApiError } from '~typings/core'

import { ApiService } from '~services/ApiService'

export const SGID_PROFILES_ENDPOINT = '/auth/sgid/profiles'

const sgidProfileKeys = {
  base: ['sgidProfiles'] as const,
}

export const useSgidProfiles = (): UseQueryResult<
  SgidProfilesDto,
  ApiError
> => {
  return useQuery<SgidProfilesDto, ApiError>(sgidProfileKeys.base, async () => {
    const { data } = await ApiService.get(SGID_PROFILES_ENDPOINT)
    return data
  })
}
