import { useQuery, UseQueryResult } from 'react-query'

import { SgidProfilesDto } from '~shared/types/auth'

import { ApiError } from '~typings/core'

import { ApiService } from '~services/ApiService'

const SGID_PROFILES_ENDPOINT = 'auth/sgid/profiles'

export const useSgidProfiles = (): UseQueryResult<
  SgidProfilesDto,
  ApiError
> => {
  return useQuery<SgidProfilesDto, ApiError>(['sgidProfiles'], () => {
    return ApiService.get(SGID_PROFILES_ENDPOINT).then(({ data }) => data)
  })
}
