import { StatusCodes } from 'http-status-codes'

import { MapRouteError } from '@root/types'
import { createLoggerWithLabel } from '../../config/logger'
import { MissingFeatureError } from '../../modules/core/core.errors'

import {
  CaptchaConnectionError,
  MissingCaptchaError,
  VerifyCaptchaError,
} from './captcha.errors'

const logger = createLoggerWithLabel(module)

export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case CaptchaConnectionError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Could not verify captcha. Please submit again in a few minutes.',
      }
    case VerifyCaptchaError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Captcha was incorrect. Please submit again.',
      }
    case MissingCaptchaError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Captcha was missing. Please refresh and submit again.',
      }
    case MissingFeatureError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage:
          'Captcha verification unavailable. Please try again later.',
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
        errorMessage: 'Sorry, something went wrong. Please try again.',
      }
  }
}
