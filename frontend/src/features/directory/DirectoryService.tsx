import { DirectoryAgencyDto, DirectoryFormDto } from '~shared/types'

import { ApiService } from '~services/ApiService'

export const DIRECTORY_BASE_ENDPOINT = '/directory'

/**
 * Gets agency list to be displayed on the directory search page.
 * @returns List of agencies that can be searched for
 */
export const getDirectoryAgencies = async (): Promise<DirectoryAgencyDto[]> => {
  return ApiService.get<DirectoryAgencyDto[]>(
    `${DIRECTORY_BASE_ENDPOINT}/agencies`,
  ).then(({ data }) => data)
}

/**
 * Gets agency list to be displayed on the directory search page.
 * @returns List of agencies that can be searched for
 */
export const getAgencyForms = async (
  agency: string,
): Promise<DirectoryFormDto[]> => {
  return ApiService.get<DirectoryFormDto[]>(
    `${DIRECTORY_BASE_ENDPOINT}/agencies/${agency}`,
  ).then(({ data }) => data)
}
