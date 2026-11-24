import { useQuery, UseQueryResult } from 'react-query'

import { SgidProfilesDto } from 'formsg-shared/types/auth'

import { ApiError } from '~typings/core'

import { ApiService } from '~services/ApiService'

export const SGID_PROFILES_ENDPOINT = '/auth/sgid/profiles'
export const RBI_IP_CHECK_ENDPOINT = '/intranet/is-rbi-check'

const loginKeys = {
  sgidProfiles: ['sgidProfiles'] as const,
  rbiIpCheck: ['rbiIpCheck'] as const,
}

export const useSgidProfiles = (): UseQueryResult<
  SgidProfilesDto,
  ApiError
> => {
  return useQuery<SgidProfilesDto, ApiError>(
    loginKeys.sgidProfiles,
    async () => {
      const { data } = await ApiService.get(SGID_PROFILES_ENDPOINT)
      return data
    },
  )
}

export const useIsRbiIpCheck = (): UseQueryResult<boolean, ApiError> => {
  return useQuery<boolean, ApiError>(loginKeys.rbiIpCheck, async () => {
    const { data } = await ApiService.get(RBI_IP_CHECK_ENDPOINT)
    return data
  })
}
