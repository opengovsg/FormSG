import { StatusCodes } from 'http-status-codes'

import { isGoGovStatusValid } from '~shared/utils/gogov-status-validation'

import { ApiService } from '~services/ApiService'

const GOGOV_ENDPOINT = '/gogov'

/**
 * Checks if link suffix is available.
 * @param linkSuffix the GoGov link suffix to check
 * @returns the availability of the link suffix
 */
export const getGoLinkAvailability = async (
  linkSuffix: string,
): Promise<boolean> => {
  return ApiService.get(`${GOGOV_ENDPOINT}/check/${linkSuffix}`, {
    validateStatus: isGoGovStatusValid,
  }).then(({ status }) => {
    // Note: status can only be StatusCodes.NOT_FOUND or StatusCodes.OK
    if (status === StatusCodes.NOT_FOUND) return true
    else return false
  })
}

export const claimGoLink = async (
  linkSuffix: string,
  formLink: string,
): Promise<boolean> => {
  return ApiService.post(`${GOGOV_ENDPOINT}/claim`, {
    formLink,
    linkSuffix,
  })
}
