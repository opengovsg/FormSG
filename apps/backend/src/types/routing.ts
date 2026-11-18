import { I18nMessageParams } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { ApplicationError } from '../app/modules/core/core.errors'

type ErrorResponseData = {
  statusCode: StatusCodes
  errorMessage: string
  errorMessageKey?: string
  errorMessageParams?: I18nMessageParams
}

export interface MapRouteError {
  (error: ApplicationError, coreErrorMessage?: string): ErrorResponseData
}

/**
 * Used when mapping route errors that might present themselves as
 * lists.
 */
export interface MapRouteErrors {
  (
    error: ApplicationError | ApplicationError[],
    coreErrorMessage?: string,
  ): ErrorResponseData
}
