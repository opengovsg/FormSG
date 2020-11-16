import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../../config/logger'
import { MapRouteError } from '../../../../types/routing'
import { MalformedParametersError } from '../../core/core.errors'

const logger = createLoggerWithLabel(module)

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages.
 * @param error The error to retrieve the status codes and error messages
 */
export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case MalformedParametersError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })

      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Something went wrong. Please try again.',
      }
  }
}
