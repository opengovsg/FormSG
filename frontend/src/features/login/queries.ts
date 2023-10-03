import { useQuery, UseQueryResult } from 'react-query'

import { SgidProfilesDto } from '~shared/types/auth'

import { ApiError } from '~typings/core'

import { ApiService } from '~services/ApiService'

export const SGID_PROFILES_ENDPOINT = '/auth/sgid/profiles'

export const useSgidProfiles = (): UseQueryResult<
  SgidProfilesDto,
  ApiError
> => {
  return useQuery<SgidProfilesDto, ApiError>(['sgidProfiles'], async () => {
    const { data } = await ApiService.get(SGID_PROFILES_ENDPOINT)
    return data
  })
}
