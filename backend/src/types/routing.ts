import { StatusCodes } from 'http-status-codes'

import { ApplicationError } from '@root/modules/core/core.errors'

type ErrorResponseData = {
  statusCode: StatusCodes
  errorMessage: string
}

export interface MapRouteError {
  (error: ApplicationError, coreErrorMessage?: string): ErrorResponseData
}
