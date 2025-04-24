import { StatusCodes } from 'http-status-codes'

import { MapRouteError } from 'src/types'

import { createLoggerWithLabel } from '../../config/logger'
import { ApplicationError } from '../core/core.errors'
import * as FormErrors from '../form/form.errors'

const logger = createLoggerWithLabel(module)

export const mapRouteError: MapRouteError = (
  error: ApplicationError,
  coreErrorMessage = 'Sorry, something went wrong. Please refresh and try again. ',
) => {
  switch (error.constructor) {
    case FormErrors.FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'This form no longer exists, please contact the agency that gave you the form link if you wish to provide feedback.',
      }
    default:
      logger.error({
        message: 'mapRouteError called with unknown error type',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
  }
}
