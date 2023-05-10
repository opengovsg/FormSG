import { StatusCodes } from 'http-status-codes'

import { ErrorDto } from '../../../../shared/types'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import * as FeatureFlagService from './feature-flags.service'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /feature-flags/enabled endpoint.
 * @returns whether feature flag has been enabled.
 */
export const handleGetEnabledFlags: ControllerHandler<
  never,
  // TODO: stricter typing to restrict typing to flag values in shared/constants
  string[] | ErrorDto
> = (req, res) => {
  // If getFeatureFlag throws a DatabaseError, we want to log it, but respond
  // to the client as if the flag is not found.
  return FeatureFlagService.getEnabledFlags()
    .map((result) => {
      return res.status(StatusCodes.OK).json(result)
    })
    .mapErr((error) => {
      logger.error({
        message: `Failed to retrieve enabled feature flags`,
        meta: {
          action: 'handleGetFeatureFlag',
          ...createReqMeta(req),
        },
        error,
      })
      return res.status(StatusCodes.OK).json([])
    })
}
