import { StatusCodes } from 'http-status-codes'

import { ErrorDto } from '../../../../shared/types'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import * as FeatureFlagService from './feature-flags.service'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /admin/forms/feature-flag endpoint.
 * @returns whether feature flag has been enabled.
 */
export const handleGetFeatureFlag: ControllerHandler<
  never,
  boolean | ErrorDto,
  never,
  { flag: string }
> = (req, res) => {
  // If getFeatureFlag throws a DatabaseError, we want to log it, but respond
  // to the client as if the flag is not found.
  return FeatureFlagService.getFeatureFlag(req.query.flag)
    .map((result) => {
      return res.status(StatusCodes.OK).json(result)
    })
    .mapErr((error) => {
      logger.error({
        message: `Failed to retrieve feature flag '${req.query.flag}'`,
        meta: {
          action: 'handleGetFeatureFlag',
          ...createReqMeta(req),
        },
        error,
      })
      return res.status(StatusCodes.OK).json(false)
    })
}
