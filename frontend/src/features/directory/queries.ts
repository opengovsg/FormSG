import { useQuery, UseQueryResult } from 'react-query'

import { DirectoryAgencyDto, DirectoryFormDto } from '~shared/types'

import { ApiError } from '~typings/core'

import { getAgencyForms, getDirectoryAgencies } from './DirectoryService'

export const directoryKeys = {
  agencies: ['agencies'] as const,
  agencyForms: (agency: string) => ['agency', agency, 'forms'],
}

export const useDirectoryAgencies = (): UseQueryResult<
  DirectoryAgencyDto[],
  ApiError
> => {
  return useQuery(directoryKeys.agencies, () => getDirectoryAgencies(), {
    staleTime: 5000,
  })
}

export const useAgencyForms = (
  agency: string,
): UseQueryResult<DirectoryFormDto[], ApiError> => {
  return useQuery(directoryKeys.agencies, () => getAgencyForms(agency), {
    staleTime: 5000,
  })
}
