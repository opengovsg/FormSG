import axios from 'axios'

import { isGoGovStatusValid } from '../../../../shared/utils/gogov-status-validation'
import { goGovConfig } from '../../config/features/gogov.config'
import { ControllerHandler } from '../core/core.types'

const GoGovBaseUrl = 'https://go.gov.sg'

// Create own axios instance with defaults.
const ApiService = axios.create({
  baseURL: GoGovBaseUrl,
})

/**
 * Checks if link suffix is available.
 * @param linkSuffix the GoGov link suffix to check
 * @returns the availability of the link suffix
 */
export const getGoLinkAvailability: ControllerHandler<{
  linkSuffix: string
}> = async (req, res) => {
  const { status: status_2 } = await ApiService.get(
    `/${req.params.linkSuffix}`,
    {
      // StatusCodes.NOT_FOUND should be valid as we expect it when links are available
      validateStatus: isGoGovStatusValid,
      // Required due to bug introduced in axios 1.2.1: https://github.com/axios/axios/issues/5346
      // TODO: remove when axios is upgraded to 1.2.2
      headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
    },
  )
  return res.sendStatus(status_2)
}

export const claimGoLink: ControllerHandler<
  null,
  null,
  { linkSuffix: string; formLink: string }
> = async (req, res) => {
  const { status } = await ApiService.post(
    '/api/v1/urls',
    {
      longUrl: req.body.formLink,
      shortUrl: req.body.linkSuffix,
    },
    {
      headers: {
        Authorization: `Bearer ${goGovConfig.goGovAPIKey}`,
        // Required due to bug introduced in axios 1.2.1: https://github.com/axios/axios/issues/5346
        // TODO: remove when axios is upgraded to 1.2.2
        'Accept-Encoding': 'gzip,deflate,compress',
      },
    },
  )
  return res.sendStatus(status)
}
