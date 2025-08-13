import { useQuery, UseQueryResult } from 'react-query'

import { SgidProfilesDto } from '~shared/types/auth'

import { ApiError } from '~typings/core'

import { ApiService } from '~services/ApiService'

export const SGID_PROFILES_ENDPOINT = '/auth/sgid/profiles'
export const INTRANET_CHECK_ENDPOINT = '/intranet/is-intranet-check'
export const OGP_IP_CHECK_ENDPOINT = '/intranet/is-ogp-check'
export const RBI_IP_CHECK_ENDPOINT = '/intranet/is-rbi-check'

const loginKeys = {
  sgidProfiles: ['sgidProfiles'] as const,
  intranetCheck: ['intranetCheck'] as const,
  ogpIpCheck: ['ogpIpCheck'] as const,
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

export const useIsIntranetCheck = (): UseQueryResult<boolean, ApiError> => {
  return useQuery<boolean, ApiError>(loginKeys.intranetCheck, async () => {
    const { data } = await ApiService.get(INTRANET_CHECK_ENDPOINT)
    return data
  })
}
export const useIsOgpIpCheck = (): UseQueryResult<boolean, ApiError> => {
  return useQuery<boolean, ApiError>(loginKeys.ogpIpCheck, async () => {
    const { data } = await ApiService.get(OGP_IP_CHECK_ENDPOINT)
    return data
  })
}
export const useIsRbiIpCheck = (): UseQueryResult<boolean, ApiError> => {
  return useQuery<boolean, ApiError>(loginKeys.rbiIpCheck, async () => {
    const { data } = await ApiService.get(RBI_IP_CHECK_ENDPOINT)
    return data
  })
}
