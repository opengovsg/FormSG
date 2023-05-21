import axios from 'axios'
import { StatusCodes } from 'http-status-codes'

// import { inspect } from 'util'
import { goGovConfig } from '../../config/features/gogov.config'
import { ControllerHandler } from '../core/core.types'

const GoGovBaseUrl = 'https://go.gov.sg'

export const claimGoLink: ControllerHandler<
  null,
  null,
  { linkSuffix: string; formLink: string }
> = async (req, res) => {
  return await axios
    .post(
      `${GoGovBaseUrl}/api/v1/urls`,
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
    .then((response) => res.send(response.data))
    .catch((err) =>
      res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).send(err),
    )
}
